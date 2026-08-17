import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  useCallback,
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
  completedBy?: string | null;
  completedAt?: Date | null;
  createdAt?: Date | null;
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
  forcarSalvarDados: () => Promise<void>;
  definirOrcamentoTotal: (valor: number) => void;
  adicionarItem: (item: NovoItem) => void;
  adicionarOnMarketItem: (item: NovoOnMarketItem) => void;
  concluirOnMarketItem: (id: number, valorUnitario: number) => void;
  finalizarCompra: (dados: {
    nome: string;
    data: string;
    fotoNotaUri?: string | null;
    completedBy?: string | null;
  }) => Promise<{
    sucesso: boolean;
    erro?: "sem-itens" | "nome-vazio" | "data-vazia" | "comprador-vazio";
  }>;
  iniciarNovoCiclo: (ano: number) => void;
  buscarCompraPorId: (id: number) => CompraHistorico | undefined;
  adicionarCategoriaPersonalizada: (nome: string, cor: string) => {
    sucesso: boolean;
    categoria?: string;
    erro?: "nome-vazio" | "categoria-existente";
  };
  removerCategoriaPersonalizada: (nome: string) => {
    sucesso: boolean;
    erro?: "categoria-nao-encontrada";
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
  ultimaAtualizacaoLocal?: number;
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

const normalizarCicloAno = (ano?: number) => {
  if (typeof ano === "number" && Number.isInteger(ano) && ano >= 2020) {
    return ano;
  }

  return new Date().getFullYear();
};
const chaveBackupLocal = (uid: string) => `smarket:orcamento:${uid}`;

const dadosIniciais: DadosSalvos = {
  orcamentoTotal: 0,
  items: [],
  onMarketItems: [],
  historicoCompras: [],
  categoriasPersonalizadas: [],
  cicloAno: normalizarCicloAno(),
  ultimaAtualizacaoLocal: 0,
};

const BudgetContext = createContext<BudgetContextValue | undefined>(undefined);

const calcularValorItem = (item: Pick<Item, "quantidade" | "valorUnitario">) =>
  item.quantidade * item.valorUnitario;

const normalizarNomeCategoria = (nome: string) => nome.trim();

const normalizarCampoData = (valor: unknown): Date | null => {
  if (valor instanceof Date) {
    return valor;
  }

  if (
    typeof valor === "object" &&
    valor !== null &&
    "toDate" in valor &&
    typeof (valor as { toDate: () => Date }).toDate === "function"
  ) {
    return (valor as { toDate: () => Date }).toDate();
  }

  if (typeof valor === "string" || typeof valor === "number") {
    const data = new Date(valor);

    if (!Number.isNaN(data.getTime())) {
      return data;
    }
  }

  return null;
};

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
    completedBy:
      typeof compra.completedBy === "string" && compra.completedBy.trim().length > 0
        ? compra.completedBy.trim()
        : null,
    completedAt: normalizarCampoData(compra.completedAt),
    createdAt: normalizarCampoData(compra.createdAt),
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

const lerBackupLocalStorage = (uid: string): DadosSalvos | null => {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return null;
    }

    const dados = window.localStorage.getItem(chaveBackupLocal(uid));

    if (!dados) {
      return null;
    }

    return JSON.parse(dados) as DadosSalvos;
  } catch {
    return null;
  }
};

const salvarBackupLocalStorage = (uid: string, dados: DadosSalvos) => {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return;
    }

    window.localStorage.setItem(chaveBackupLocal(uid), JSON.stringify(dados));
  } catch {
    return;
  }
};

const lerBackupLocal = async (uid: string): Promise<DadosSalvos | null> => {
  const backupLocalStorage = lerBackupLocalStorage(uid);

  if (backupLocalStorage) {
    return backupLocalStorage;
  }

  try {
    const dados = await AsyncStorage.getItem(chaveBackupLocal(uid));

    if (!dados) {
      return null;
    }

    return JSON.parse(dados) as DadosSalvos;
  } catch {
    return null;
  }
};

const salvarBackupLocal = async (uid: string, dados: DadosSalvos) => {
  salvarBackupLocalStorage(uid, dados);

  try {
    await AsyncStorage.setItem(chaveBackupLocal(uid), JSON.stringify(dados));
  } catch {
    return;
  }
};

const normalizarDadosSalvos = (dados: Partial<DadosSalvos>): DadosSalvos => {
  const categoriasCustomizadas = normalizarCategoriasPersonalizadas(
    dados.categoriasPersonalizadas
  );

  return {
    orcamentoTotal: typeof dados.orcamentoTotal === "number" ? dados.orcamentoTotal : 0,
    categoriasPersonalizadas: categoriasCustomizadas,
    cicloAno: normalizarCicloAno(),
    items: Array.isArray(dados.items)
      ? dados.items.map((item) => normalizarItem(item as Item, categoriasCustomizadas))
      : [],
    onMarketItems: Array.isArray(dados.onMarketItems)
      ? dados.onMarketItems.map((item) =>
          normalizarOnMarketItem(item as OnMarketItem, categoriasCustomizadas)
        )
      : [],
    historicoCompras: Array.isArray(dados.historicoCompras)
      ? dados.historicoCompras.map((compra) =>
          normalizarCompraHistorico(compra as CompraHistorico, categoriasCustomizadas)
        )
      : [],
    ultimaAtualizacaoLocal:
      typeof dados.ultimaAtualizacaoLocal === "number" ? dados.ultimaAtualizacaoLocal : 0,
  };
};

export function BudgetProvider({ children }: { children: ReactNode }) {
  const [orcamentoTotal, setOrcamentoTotal] = useState(0);
  const [items, setItems] = useState<Item[]>([]);
  const [onMarketItems, setOnMarketItems] = useState<OnMarketItem[]>([]);
  const [historicoCompras, setHistoricoCompras] = useState<CompraHistorico[]>([]);
  const [categoriasPersonalizadas, setCategoriasPersonalizadas] = useState<CategoriaOpcao[]>([]);
const [cicloAno, setCicloAno] = useState(normalizarCicloAno());
  const [carregandoDados, setCarregandoDados] = useState(true);
  const usuarioAtualRef = useRef<string | null>(null);
  const podeSalvarRef = useRef(false);
  const orcamentoTotalRef = useRef(0);
  const itemsRef = useRef<Item[]>([]);
  const onMarketItemsRef = useRef<OnMarketItem[]>([]);
  const historicoComprasRef = useRef<CompraHistorico[]>([]);
  const categoriasPersonalizadasRef = useRef<CategoriaOpcao[]>([]);
  const cicloAnoRef = useRef(normalizarCicloAno());

  const salvarDadosUsuario = useCallback(async (uid: string, dadosParaSalvar: DadosSalvos) => {
    if (!uid) {
      return;
    }

    await salvarBackupLocal(uid, dadosParaSalvar);

    try {
      await setDoc(orcamentoDocRef(uid), {
        ...dadosParaSalvar,
        atualizadoEm: serverTimestamp(),
      });
    } catch {
      return;
    }
  }, []);

  const salvarEstadoAtualComOverrides = useCallback(
    async (overrides?: Partial<DadosSalvos>) => {
      const uid = usuarioAtualRef.current;

      if (!uid) {
        return;
      }

      const dadosParaSalvar = {
        orcamentoTotal: overrides?.orcamentoTotal ?? orcamentoTotalRef.current,
        items: overrides?.items ?? itemsRef.current,
        onMarketItems: overrides?.onMarketItems ?? onMarketItemsRef.current,
        historicoCompras: overrides?.historicoCompras ?? historicoComprasRef.current,
        categoriasPersonalizadas:
          overrides?.categoriasPersonalizadas ?? categoriasPersonalizadasRef.current,
        cicloAno: overrides?.cicloAno ?? cicloAnoRef.current,
        ultimaAtualizacaoLocal: Date.now(),
      };

      await salvarBackupLocal(uid, dadosParaSalvar);

      if (!podeSalvarRef.current) {
        return;
      }

      await salvarDadosUsuario(uid, dadosParaSalvar);
    },
    [salvarDadosUsuario]
  );

  const montarDadosParaSalvar = useCallback(
    (): DadosSalvos => ({
      orcamentoTotal,
      items,
      onMarketItems,
      historicoCompras,
      categoriasPersonalizadas,
      cicloAno,
      ultimaAtualizacaoLocal: Date.now(),
    }),
    [
      categoriasPersonalizadas,
      cicloAno,
      historicoCompras,
      items,
      onMarketItems,
      orcamentoTotal,
    ]
  );

  const forcarSalvarDados = useCallback(async () => {
    const uid = usuarioAtualRef.current;

    if (!uid) {
      return;
    }

    await salvarDadosUsuario(uid, montarDadosParaSalvar());
  }, [montarDadosParaSalvar, salvarDadosUsuario]);

  const aplicarDadosSalvos = (dados: DadosSalvos) => {
    orcamentoTotalRef.current = dados.orcamentoTotal;
    itemsRef.current = dados.items;
    onMarketItemsRef.current = dados.onMarketItems ?? [];
    historicoComprasRef.current = dados.historicoCompras ?? [];
    categoriasPersonalizadasRef.current = dados.categoriasPersonalizadas ?? [];
    cicloAnoRef.current = normalizarCicloAno();
    setOrcamentoTotal(dados.orcamentoTotal);
    setItems(dados.items);
    setOnMarketItems(dados.onMarketItems ?? []);
    setHistoricoCompras(dados.historicoCompras ?? []);
    setCategoriasPersonalizadas(dados.categoriasPersonalizadas ?? []);
    setCicloAno(normalizarCicloAno());
  };

  useEffect(() => {
    orcamentoTotalRef.current = orcamentoTotal;
  }, [orcamentoTotal]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    onMarketItemsRef.current = onMarketItems;
  }, [onMarketItems]);

  useEffect(() => {
    historicoComprasRef.current = historicoCompras;
  }, [historicoCompras]);

  useEffect(() => {
    categoriasPersonalizadasRef.current = categoriasPersonalizadas;
  }, [categoriasPersonalizadas]);

  useEffect(() => {
    cicloAnoRef.current = cicloAno;
  }, [cicloAno]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      let leituraConcluidaComSucesso = false;
      podeSalvarRef.current = false;
      setCarregandoDados(true);

      if (!user) {
        usuarioAtualRef.current = null;
        setOrcamentoTotal(dadosIniciais.orcamentoTotal);
        setItems(dadosIniciais.items);
        setOnMarketItems(dadosIniciais.onMarketItems ?? []);
        setHistoricoCompras(dadosIniciais.historicoCompras ?? []);
        setCategoriasPersonalizadas(dadosIniciais.categoriasPersonalizadas ?? []);
        setCicloAno(normalizarCicloAno());
        setCarregandoDados(false);
        return;
      }

      usuarioAtualRef.current = user.uid;
      const perfilRef = usuarioDocRef(user.uid);
      const documentoRef = orcamentoDocRef(user.uid);
      const backupLocal = await lerBackupLocal(user.uid);

      if (backupLocal) {
        aplicarDadosSalvos(normalizarDadosSalvos(backupLocal));
      }

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
          const dadosRemotos = normalizarDadosSalvos(snapshot.data() as Partial<DadosSalvos>);
          const dadosLocais = backupLocal ? normalizarDadosSalvos(backupLocal) : null;
          const usarDadosLocais =
            !!dadosLocais &&
            (dadosLocais.ultimaAtualizacaoLocal ?? 0) >
              (dadosRemotos.ultimaAtualizacaoLocal ?? 0);

          const dadosEscolhidos = usarDadosLocais && dadosLocais ? dadosLocais : dadosRemotos;

          aplicarDadosSalvos(dadosEscolhidos);

          if (usarDadosLocais && dadosLocais) {
            await salvarDadosUsuario(user.uid, dadosLocais);
          }

          leituraConcluidaComSucesso = true;
        } else if (backupLocal) {
          const dadosLocais = normalizarDadosSalvos(backupLocal);
          aplicarDadosSalvos(dadosLocais);
          await salvarDadosUsuario(user.uid, dadosLocais);
          leituraConcluidaComSucesso = true;
        } else {
          aplicarDadosSalvos(dadosIniciais);
          await salvarDadosUsuario(user.uid, {
            ...dadosIniciais,
            ultimaAtualizacaoLocal: Date.now(),
          });
          leituraConcluidaComSucesso = true;
        }
      } catch {
        // Se a leitura falhar, mantemos o estado atual e evitamos sobrescrever o Firestore com zeros.
      } finally {
        podeSalvarRef.current = leituraConcluidaComSucesso;
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
      await salvarDadosUsuario(uid, montarDadosParaSalvar());
    };

    salvar();
  }, [
    carregandoDados,
    montarDadosParaSalvar,
    salvarDadosUsuario,
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
      forcarSalvarDados,
      definirOrcamentoTotal: (valor) => {
        orcamentoTotalRef.current = valor;
        setOrcamentoTotal(valor);
        salvarEstadoAtualComOverrides({ orcamentoTotal: valor }).catch(() => undefined);
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

        const proximasCategorias = [
          ...categoriasPersonalizadasRef.current,
          { nome: nomeNormalizado, cor, personalizada: true },
        ];

        categoriasPersonalizadasRef.current = proximasCategorias;
        setCategoriasPersonalizadas(proximasCategorias);
        salvarEstadoAtualComOverrides({
          categoriasPersonalizadas: proximasCategorias,
        }).catch(() => undefined);

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

        const proximasCategorias = categoriasPersonalizadasRef.current.filter(
          (categoria) => categoria.nome !== nomeNormalizado
        );

        categoriasPersonalizadasRef.current = proximasCategorias;
        setCategoriasPersonalizadas(proximasCategorias);
        salvarEstadoAtualComOverrides({
          categoriasPersonalizadas: proximasCategorias,
        }).catch(() => undefined);

        return { sucesso: true };
      },
      adicionarItem: (item) => {
        const novoItem = normalizarItem(
          {
            ...item,
            id: Date.now(),
            cor: getCorCategoria(item.categoria, categoriasPersonalizadasRef.current),
          },
          categoriasPersonalizadasRef.current
        );
        const proximosItems = [...itemsRef.current, novoItem];

        itemsRef.current = proximosItems;
        setItems(proximosItems);
        salvarEstadoAtualComOverrides({ items: proximosItems }).catch(() => undefined);
      },
      adicionarOnMarketItem: (item) => {
        const novoItem = normalizarOnMarketItem(
          {
            ...item,
            id: Date.now(),
            cor: getCorCategoria(item.categoria, categoriasPersonalizadasRef.current),
          },
          categoriasPersonalizadasRef.current
        );
        const proximosItens = [...onMarketItemsRef.current, novoItem];

        onMarketItemsRef.current = proximosItens;
        setOnMarketItems(proximosItens);
        salvarEstadoAtualComOverrides({
          onMarketItems: proximosItens,
        }).catch(() => undefined);
      },
      concluirOnMarketItem: (id, valorUnitario) => {
        if (valorUnitario <= 0) {
          return;
        }

        const itemConcluido = onMarketItemsRef.current.find((item) => item.id === id);

        if (!itemConcluido) {
          return;
        }

        const proximosOnMarketItems = onMarketItemsRef.current.filter((item) => item.id !== id);
        const proximosItems = [
          ...itemsRef.current,
          normalizarItem(
            {
              ...itemConcluido,
              valorUnitario,
            },
            categoriasPersonalizadasRef.current
          ),
        ];

        onMarketItemsRef.current = proximosOnMarketItems;
        itemsRef.current = proximosItems;
        setOnMarketItems(proximosOnMarketItems);
        setItems(proximosItems);
        salvarEstadoAtualComOverrides({
          items: proximosItems,
          onMarketItems: proximosOnMarketItems,
        }).catch(() => undefined);
      },
      finalizarCompra: async ({ nome, data, fotoNotaUri, completedBy }) => {
        if (!nome.trim()) {
          return { sucesso: false, erro: "nome-vazio" };
        }

        if (!data.trim()) {
          return { sucesso: false, erro: "data-vazia" };
        }

        if (items.length === 0) {
          return { sucesso: false, erro: "sem-itens" };
        }

        const completedByNormalizado =
          typeof completedBy === "string" ? completedBy.trim() : "";

        if (completedBy !== undefined && completedBy !== null && !completedByNormalizado) {
          return { sucesso: false, erro: "comprador-vazio" };
        }

        const totalGasto = items.reduce((total, item) => total + calcularValorItem(item), 0);
        const diaDoMes = Number(data.split("-")[2] ?? "1");
        const gastoPorCategoria = criarResumoCategorias(items, categoriasPersonalizadas);
        const agora = new Date();

        const compra: CompraHistorico = {
          id: Date.now(),
          nome: nome.trim(),
          data,
          fotoNotaUri: fotoNotaUri ?? null,
          completedBy: completedByNormalizado || null,
          completedAt: agora,
          createdAt: agora,
          items,
          totalGasto,
          mediaDiaria: diaDoMes > 0 ? totalGasto / diaDoMes : totalGasto,
          categoriasAtivas: gastoPorCategoria.length,
          gastoPorCategoria,
        };

        const historicoAtualizado = [compra, ...historicoCompras];

        historicoComprasRef.current = historicoAtualizado;
        itemsRef.current = [];
        setHistoricoCompras(historicoAtualizado);
        setItems([]);
        await salvarDadosUsuario(usuarioAtualRef.current ?? "", {
          orcamentoTotal,
          items: [],
          onMarketItems,
          historicoCompras: historicoAtualizado,
          categoriasPersonalizadas,
          cicloAno,
          ultimaAtualizacaoLocal: Date.now(),
        });

        return { sucesso: true };
      },
iniciarNovoCiclo: (ano) => {
        setCicloAno(normalizarCicloAno(ano));
        setHistoricoCompras([]);
        setItems([]);
        setOnMarketItems([]);
      },
      buscarCompraPorId: (id) => historicoCompras.find((compra) => compra.id === id),
      deletarItem: (id) => {
        const proximosItems = itemsRef.current.filter((item) => item.id !== id);
        itemsRef.current = proximosItems;
        setItems(proximosItems);
        salvarEstadoAtualComOverrides({ items: proximosItems }).catch(() => undefined);
      },
      incrementarQuantidade: (id) => {
        const proximosItems = itemsRef.current.map((item) =>
          item.id === id ? { ...item, quantidade: item.quantidade + 1 } : item
        );
        itemsRef.current = proximosItems;
        setItems(proximosItems);
        salvarEstadoAtualComOverrides({ items: proximosItems }).catch(() => undefined);
      },
      decrementarQuantidade: (id) => {
        const proximosItems = itemsRef.current.map((item) => {
          if (item.id !== id) {
            return item;
          }

          return {
            ...item,
            quantidade: Math.max(0, item.quantidade - 1),
          };
        });
        itemsRef.current = proximosItems;
        setItems(proximosItems);
        salvarEstadoAtualComOverrides({ items: proximosItems }).catch(() => undefined);
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
      forcarSalvarDados,
      gastosPorCategoria,
      historicoCompras,
      items,
      onMarketItems,
      opcoesCategoria,
      orcamentoRestante,
      orcamentoTotal,
      salvarEstadoAtualComOverrides,
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
