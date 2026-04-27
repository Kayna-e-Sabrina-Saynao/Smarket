import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { auth, db } from "../firebaseConfig";

export const CATEGORIAS_PADRAO = [
  "Mercado",
  "Frios",
  "Limpeza",
  "Pets",
  "Outros",
  "Hortifruti",
  "Higiene",
  "Padaria",
] as const;

export type Categoria = string;

export type CategoriaOpcao = {
  nome: string;
  cor: string;
  personalizada?: boolean;
};

export type Item = {
  id: number;
  nome: string;
  cor: string;
  quantidade: number;
  categoria: Categoria;
  valorUnitario: number;
};

export type OnMarketItem = Omit<Item, "valorUnitario">;

export type GastoCategoria = {
  nome: string;
  valor: number;
  percentual: number;
  cor: string;
  quantidadeItens: number;
};

export type CompraHistorico = {
  id: number;
  nome: string;
  data: string;
  fotoNotaUri?: string | null;
  items: Item[];
  totalGasto: number;
  mediaDiaria: number;
  categoriasAtivas: number;
  gastoPorCategoria: GastoCategoria[];
};

type NovoItem = Omit<Item, "id" | "cor">;
type NovoOnMarketItem = Omit<OnMarketItem, "id" | "cor">;

type BudgetContextValue = {
  categorias: string[];
  opcoesCategoria: CategoriaOpcao[];
  items: Item[];
  onMarketItems: OnMarketItem[];
  historicoCompras: CompraHistorico[];
  cicloAno: number;
  orcamentoTotal: number;
  valorGasto: number;
  orcamentoRestante: number;
  gastosPorCategoria: GastoCategoria[];
  carregandoDados: boolean;
  definirOrcamentoTotal: (valor: number) => void;
  adicionarItem: (item: NovoItem) => void;
  adicionarOnMarketItem: (item: NovoOnMarketItem) => void;
  concluirOnMarketItem: (id: number, valorUnitario: number) => void;
  finalizarCompra: (dados: {
    nome: string;
    data: string;
    fotoNotaUri?: string | null;
  }) => {
    sucesso: boolean;
    erro?: "sem-itens" | "nome-vazio" | "data-vazia";
  };
  iniciarNovoCiclo: (ano: number) => void;
  buscarCompraPorId: (id: number) => CompraHistorico | undefined;
  adicionarCategoriaPersonalizada: (nome: string, cor: string) => {
    sucesso: boolean;
    categoria?: string;
    erro?: "nome-vazio" | "categoria-existente";
  };
  removerCategoriaPersonalizada: (nome: string) => {
    sucesso: boolean;
    erro?: "categoria-em-uso" | "categoria-nao-encontrada";
  };
  deletarItem: (id: number) => void;
  incrementarQuantidade: (id: number) => void;
  decrementarQuantidade: (id: number) => void;
  listarItensPorCategoria: (categoria: string) => Item[];
  totalCategoria: (categoria: string) => number;
};

type DadosSalvos = {
  orcamentoTotal: number;
  items: Item[];
  onMarketItems?: OnMarketItem[];
  historicoCompras?: CompraHistorico[];
  categoriasPersonalizadas?: CategoriaOpcao[];
  cicloAno?: number;
};

const categoriasPadrao: CategoriaOpcao[] = [
  { nome: "Mercado", cor: "#f2c94c" },
  { nome: "Frios", cor: "#6c5ce7" },
  { nome: "Limpeza", cor: "#7c6df2" },
  { nome: "Pets", cor: "#e17055" },
  { nome: "Outros", cor: "#8e9aaf" },
  { nome: "Hortifruti", cor: "#27ae60" },
  { nome: "Higiene", cor: "#ff8fab" },
  { nome: "Padaria", cor: "#d4a373" },
];

const anoAtual = new Date().getFullYear();

const dadosIniciais: DadosSalvos = {
  orcamentoTotal: 0,
  items: [],
  onMarketItems: [],
  historicoCompras: [],
  categoriasPersonalizadas: [],
  cicloAno: anoAtual,
};

const BudgetContext = createContext<BudgetContextValue | undefined>(undefined);

const calcularValorItem = (item: Pick<Item, "quantidade" | "valorUnitario">) =>
  item.quantidade * item.valorUnitario;

const normalizarNomeCategoria = (nome: string) => nome.trim();

const getCorCategoria = (categoria: string, categoriasPersonalizadas: CategoriaOpcao[]) => {
  const categoriaPadrao = categoriasPadrao.find((item) => item.nome === categoria);

  if (categoriaPadrao) {
    return categoriaPadrao.cor;
  }

  const categoriaCustomizada = categoriasPersonalizadas.find((item) => item.nome === categoria);
  return categoriaCustomizada?.cor ?? "#5f6f66";
};

const normalizarCategoriaPersonalizada = (categoria: CategoriaOpcao): CategoriaOpcao => ({
  nome: normalizarNomeCategoria(categoria.nome),
  cor: categoria.cor,
  personalizada: true,
});

const normalizarCategoriasPersonalizadas = (
  categoriasPersonalizadas: CategoriaOpcao[] | undefined
) =>
  Array.isArray(categoriasPersonalizadas)
    ? categoriasPersonalizadas
        .map((categoria) => normalizarCategoriaPersonalizada(categoria))
        .filter((categoria) => categoria.nome.length > 0)
    : [];

const normalizarItem = (item: Item, categoriasPersonalizadas: CategoriaOpcao[]): Item => {
  const categoria = normalizarNomeCategoria(item.categoria);
  const corCategoria = getCorCategoria(categoria, categoriasPersonalizadas);

  return {
    ...item,
    categoria,
    cor: corCategoria === "#5f6f66" && item.cor ? item.cor : corCategoria,
  };
};

const normalizarOnMarketItem = (
  item: OnMarketItem,
  categoriasPersonalizadas: CategoriaOpcao[]
): OnMarketItem => {
  const categoria = normalizarNomeCategoria(item.categoria);
  const corCategoria = getCorCategoria(categoria, categoriasPersonalizadas);

  return {
    ...item,
    categoria,
    cor: corCategoria === "#5f6f66" && item.cor ? item.cor : corCategoria,
  };
};

const criarResumoCategorias = (
  items: Item[],
  categoriasPersonalizadas: CategoriaOpcao[]
): GastoCategoria[] => {
  const valorTotal = items.reduce((total, item) => total + calcularValorItem(item), 0);
  const categoriasAtivas = Array.from(new Set(items.map((item) => item.categoria)));

  return categoriasAtivas
    .map((categoria) => {
      const itensDaCategoria = items.filter((item) => item.categoria === categoria);
      const valor = itensDaCategoria.reduce((total, item) => total + calcularValorItem(item), 0);
      const quantidadeItens = itensDaCategoria.reduce(
        (total, item) => total + item.quantidade,
        0
      );

      return {
        nome: categoria,
        valor,
        percentual: valorTotal === 0 ? 0 : (valor / valorTotal) * 100,
        cor: getCorCategoria(categoria, categoriasPersonalizadas),
        quantidadeItens,
      };
    })
    .sort((a, b) => b.valor - a.valor);
};

const normalizarCompraHistorico = (
  compra: CompraHistorico,
  categoriasPersonalizadas: CategoriaOpcao[]
): CompraHistorico => {
  const items = Array.isArray(compra.items)
    ? compra.items.map((item) => normalizarItem(item, categoriasPersonalizadas))
    : [];

  return {
    ...compra,
    fotoNotaUri: compra.fotoNotaUri ?? null,
    items,
    totalGasto:
      typeof compra.totalGasto === "number"
        ? compra.totalGasto
        : items.reduce((total, item) => total + calcularValorItem(item), 0),
    mediaDiaria:
      typeof compra.mediaDiaria === "number" ? compra.mediaDiaria : 0,
    categoriasAtivas:
      typeof compra.categoriasAtivas === "number"
        ? compra.categoriasAtivas
        : new Set(items.map((item) => item.categoria)).size,
    gastoPorCategoria:
      Array.isArray(compra.gastoPorCategoria) && compra.gastoPorCategoria.length > 0
        ? compra.gastoPorCategoria
        : criarResumoCategorias(items, categoriasPersonalizadas),
  };
};

const usuarioDocRef = (uid: string) => doc(db, "usuarios", uid);
const orcamentoDocRef = (uid: string) => doc(db, "usuarios", uid, "orcamento", "atual");

export function BudgetProvider({ children }: { children: ReactNode }) {
  const [orcamentoTotal, setOrcamentoTotal] = useState(0);
  const [items, setItems] = useState<Item[]>([]);
  const [onMarketItems, setOnMarketItems] = useState<OnMarketItem[]>([]);
  const [historicoCompras, setHistoricoCompras] = useState<CompraHistorico[]>([]);
  const [categoriasPersonalizadas, setCategoriasPersonalizadas] = useState<CategoriaOpcao[]>([]);
  const [cicloAno, setCicloAno] = useState(anoAtual);
  const [carregandoDados, setCarregandoDados] = useState(true);
  const usuarioAtualRef = useRef<string | null>(null);
  const podeSalvarRef = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      podeSalvarRef.current = false;
      setCarregandoDados(true);

      if (!user) {
        usuarioAtualRef.current = null;
        setOrcamentoTotal(dadosIniciais.orcamentoTotal);
        setItems(dadosIniciais.items);
        setOnMarketItems(dadosIniciais.onMarketItems ?? []);
        setHistoricoCompras(dadosIniciais.historicoCompras ?? []);
        setCategoriasPersonalizadas(dadosIniciais.categoriasPersonalizadas ?? []);
        setCicloAno(dadosIniciais.cicloAno ?? anoAtual);
        setCarregandoDados(false);
        return;
      }

      usuarioAtualRef.current = user.uid;
      const perfilRef = usuarioDocRef(user.uid);
      const documentoRef = orcamentoDocRef(user.uid);

      try {
        const perfilSnapshot = await getDoc(perfilRef);

        if (!perfilSnapshot.exists()) {
          await setDoc(
            perfilRef,
            {
              email: user.email ?? "",
              perfil: "padrao",
              criadoEm: serverTimestamp(),
              atualizadoEm: serverTimestamp(),
            },
            { merge: true }
          );
        } else {
          await setDoc(
            perfilRef,
            {
              email: user.email ?? "",
              atualizadoEm: serverTimestamp(),
            },
            { merge: true }
          );
        }

        const snapshot = await getDoc(documentoRef);

        if (snapshot.exists()) {
          const dados = snapshot.data() as Partial<DadosSalvos>;
          const categoriasCustomizadas = normalizarCategoriasPersonalizadas(
            dados.categoriasPersonalizadas
          );

          setOrcamentoTotal(typeof dados.orcamentoTotal === "number" ? dados.orcamentoTotal : 0);
          setCategoriasPersonalizadas(categoriasCustomizadas);
          setCicloAno(typeof dados.cicloAno === "number" ? dados.cicloAno : anoAtual);
          setItems(
            Array.isArray(dados.items)
              ? dados.items.map((item) => normalizarItem(item as Item, categoriasCustomizadas))
              : []
          );
          setOnMarketItems(
            Array.isArray(dados.onMarketItems)
              ? dados.onMarketItems.map((item) =>
                  normalizarOnMarketItem(item as OnMarketItem, categoriasCustomizadas)
                )
              : []
          );
          setHistoricoCompras(
            Array.isArray(dados.historicoCompras)
              ? dados.historicoCompras.map((compra) =>
                  normalizarCompraHistorico(compra as CompraHistorico, categoriasCustomizadas)
                )
              : []
          );
        } else {
          setOrcamentoTotal(0);
          setItems([]);
          setOnMarketItems([]);
          setHistoricoCompras([]);
          setCategoriasPersonalizadas([]);
          setCicloAno(anoAtual);
          await setDoc(documentoRef, {
            ...dadosIniciais,
            atualizadoEm: serverTimestamp(),
          });
        }
      } catch {
        setOrcamentoTotal(0);
        setItems([]);
        setOnMarketItems([]);
        setHistoricoCompras([]);
        setCategoriasPersonalizadas([]);
        setCicloAno(anoAtual);
      } finally {
        podeSalvarRef.current = true;
        setCarregandoDados(false);
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const uid = usuarioAtualRef.current;

    if (!uid || !podeSalvarRef.current || carregandoDados) {
      return;
    }

    const salvar = async () => {
      try {
        await setDoc(orcamentoDocRef(uid), {
          orcamentoTotal,
          items,
          onMarketItems,
          historicoCompras,
          categoriasPersonalizadas,
          cicloAno,
          atualizadoEm: serverTimestamp(),
        });
      } catch {
        return;
      }
    };

    salvar();
  }, [
    carregandoDados,
    categoriasPersonalizadas,
    cicloAno,
    historicoCompras,
    items,
    onMarketItems,
    orcamentoTotal,
  ]);

  const opcoesCategoria = useMemo(
    () => [...categoriasPadrao, ...categoriasPersonalizadas],
    [categoriasPersonalizadas]
  );

  const categorias = useMemo(
    () => opcoesCategoria.map((categoria) => categoria.nome),
    [opcoesCategoria]
  );

  const itensHistoricosDoCiclo = useMemo(
    () => historicoCompras.flatMap((compra) => compra.items),
    [historicoCompras]
  );

  const itensDoCiclo = useMemo(
    () => [...itensHistoricosDoCiclo, ...items],
    [itensHistoricosDoCiclo, items]
  );

  const valorGasto = useMemo(
    () => itensDoCiclo.reduce((total, item) => total + calcularValorItem(item), 0),
    [itensDoCiclo]
  );

  const orcamentoRestante = orcamentoTotal - valorGasto;

  const gastosPorCategoria = useMemo(
    () => criarResumoCategorias(itensDoCiclo, categoriasPersonalizadas),
    [categoriasPersonalizadas, itensDoCiclo]
  );

  const value = useMemo<BudgetContextValue>(
    () => ({
      categorias,
      opcoesCategoria,
      items,
      onMarketItems,
      historicoCompras,
      cicloAno,
      orcamentoTotal,
      valorGasto,
      orcamentoRestante,
      gastosPorCategoria,
      carregandoDados,
      definirOrcamentoTotal: (valor) => {
        setOrcamentoTotal(valor);
      },
      adicionarCategoriaPersonalizada: (nome, cor) => {
        const nomeNormalizado = normalizarNomeCategoria(nome);

        if (!nomeNormalizado) {
          return { sucesso: false, erro: "nome-vazio" };
        }

        const categoriaExistente = [...categoriasPadrao, ...categoriasPersonalizadas].find(
          (categoria) => categoria.nome.toLowerCase() === nomeNormalizado.toLowerCase()
        );

        if (categoriaExistente) {
          return { sucesso: false, erro: "categoria-existente" };
        }

        setCategoriasPersonalizadas((estadoAtual) => [
          ...estadoAtual,
          { nome: nomeNormalizado, cor, personalizada: true },
        ]);

        return { sucesso: true, categoria: nomeNormalizado };
      },
      removerCategoriaPersonalizada: (nome) => {
        const nomeNormalizado = normalizarNomeCategoria(nome);
        const categoriaExiste = categoriasPersonalizadas.some(
          (categoria) => categoria.nome === nomeNormalizado
        );

        if (!categoriaExiste) {
          return { sucesso: false, erro: "categoria-nao-encontrada" };
        }

        const categoriaEmUso =
          items.some((item) => item.categoria === nomeNormalizado) ||
          onMarketItems.some((item) => item.categoria === nomeNormalizado) ||
          historicoCompras.some((compra) =>
            compra.items.some((item) => item.categoria === nomeNormalizado)
          );

        if (categoriaEmUso) {
          return { sucesso: false, erro: "categoria-em-uso" };
        }

        setCategoriasPersonalizadas((estadoAtual) =>
          estadoAtual.filter((categoria) => categoria.nome !== nomeNormalizado)
        );

        return { sucesso: true };
      },
      adicionarItem: (item) => {
        setItems((estadoAtual) => [
          ...estadoAtual,
          normalizarItem(
            {
              ...item,
              id: Date.now(),
              cor: getCorCategoria(item.categoria, categoriasPersonalizadas),
            },
            categoriasPersonalizadas
          ),
        ]);
      },
      adicionarOnMarketItem: (item) => {
        setOnMarketItems((estadoAtual) => [
          ...estadoAtual,
          normalizarOnMarketItem(
            {
              ...item,
              id: Date.now(),
              cor: getCorCategoria(item.categoria, categoriasPersonalizadas),
            },
            categoriasPersonalizadas
          ),
        ]);
      },
      concluirOnMarketItem: (id, valorUnitario) => {
        if (valorUnitario <= 0) {
          return;
        }

        setOnMarketItems((estadoAtual) => {
          const itemConcluido = estadoAtual.find((item) => item.id === id);

          if (!itemConcluido) {
            return estadoAtual;
          }

          setItems((itensAtuais) => [
            ...itensAtuais,
            normalizarItem(
              {
                ...itemConcluido,
                valorUnitario,
              },
              categoriasPersonalizadas
            ),
          ]);

          return estadoAtual.filter((item) => item.id !== id);
        });
      },
      finalizarCompra: ({ nome, data, fotoNotaUri }) => {
        if (!nome.trim()) {
          return { sucesso: false, erro: "nome-vazio" };
        }

        if (!data.trim()) {
          return { sucesso: false, erro: "data-vazia" };
        }

        if (items.length === 0) {
          return { sucesso: false, erro: "sem-itens" };
        }

        const totalGasto = items.reduce((total, item) => total + calcularValorItem(item), 0);
        const diaDoMes = Number(data.split("-")[2] ?? "1");
        const gastoPorCategoria = criarResumoCategorias(items, categoriasPersonalizadas);

        const compra: CompraHistorico = {
          id: Date.now(),
          nome: nome.trim(),
          data,
          fotoNotaUri: fotoNotaUri ?? null,
          items,
          totalGasto,
          mediaDiaria: diaDoMes > 0 ? totalGasto / diaDoMes : totalGasto,
          categoriasAtivas: gastoPorCategoria.length,
          gastoPorCategoria,
        };

        setHistoricoCompras((estadoAtual) => [compra, ...estadoAtual]);
        setItems([]);

        return { sucesso: true };
      },
      iniciarNovoCiclo: (ano) => {
        setCicloAno(ano);
        setHistoricoCompras([]);
        setItems([]);
        setOnMarketItems([]);
      },
      buscarCompraPorId: (id) => historicoCompras.find((compra) => compra.id === id),
      deletarItem: (id) => {
        setItems((estadoAtual) => estadoAtual.filter((item) => item.id !== id));
      },
      incrementarQuantidade: (id) => {
        setItems((estadoAtual) =>
          estadoAtual.map((item) =>
            item.id === id ? { ...item, quantidade: item.quantidade + 1 } : item
          )
        );
      },
      decrementarQuantidade: (id) => {
        setItems((estadoAtual) =>
          estadoAtual.map((item) => {
            if (item.id !== id) {
              return item;
            }

            return {
              ...item,
              quantidade: Math.max(0, item.quantidade - 1),
            };
          })
        );
      },
      listarItensPorCategoria: (categoria) =>
        items.filter((item) => item.categoria === categoria && item.quantidade > 0),
      totalCategoria: (categoria) =>
        items
          .filter((item) => item.categoria === categoria)
          .reduce((total, item) => total + calcularValorItem(item), 0),
    }),
    [
      carregandoDados,
      categorias,
      categoriasPersonalizadas,
      cicloAno,
      gastosPorCategoria,
      historicoCompras,
      items,
      onMarketItems,
      opcoesCategoria,
      orcamentoRestante,
      orcamentoTotal,
      valorGasto,
    ]
  );

  return <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>;
}

export function useBudget() {
  const context = useContext(BudgetContext);

  if (!context) {
    throw new Error("useBudget must be used within BudgetProvider");
  }

  return context;
}
