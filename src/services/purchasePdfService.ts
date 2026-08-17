import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import QRCode from "qrcode";

import { CompraHistorico } from "@/context/budget-context";

const CUPOM_LARGURA = 40;

const formatarMoeda = (valor: number) =>
  valor.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatarData = (data: Date) => data.toLocaleDateString("pt-BR");
const formatarHora = (data: Date) =>
  data.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

const escaparHtml = (valor: string) =>
  valor
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const centralizar = (texto: string, largura = CUPOM_LARGURA) => {
  const conteudo = texto.trim();

  if (conteudo.length >= largura) {
    return conteudo;
  }

  const espacos = Math.floor((largura - conteudo.length) / 2);
  return `${" ".repeat(espacos)}${conteudo}`;
};

const preencherDireita = (texto: string, largura: number) => {
  if (texto.length >= largura) {
    return texto.slice(0, largura);
  }

  return `${texto}${" ".repeat(largura - texto.length)}`;
};

const preencherEsquerda = (texto: string, largura: number) => {
  if (texto.length >= largura) {
    return texto.slice(0, largura);
  }

  return `${" ".repeat(largura - texto.length)}${texto}`;
};

const quebrarTexto = (texto: string, largura: number) => {
  const palavras = texto.trim().split(/\s+/);
  const linhas: string[] = [];
  let linhaAtual = "";

  palavras.forEach((palavra) => {
    if (!linhaAtual.length) {
      linhaAtual = palavra;
      return;
    }

    const tentativa = `${linhaAtual} ${palavra}`;

    if (tentativa.length <= largura) {
      linhaAtual = tentativa;
      return;
    }

    linhas.push(linhaAtual);
    linhaAtual = palavra;
  });

  if (linhaAtual.length) {
    linhas.push(linhaAtual);
  }

  return linhas.length ? linhas : [texto.slice(0, largura)];
};

const gerarCodigoCompra = (compra: CompraHistorico) => {
  const [ano, mes, dia] = compra.data.split("-");
  return `SMP-${ano}${mes}${dia}-${String(compra.id).padStart(6, "0")}`;
};

const obterDataBase = (compra: CompraHistorico) =>
  compra.completedAt ?? compra.createdAt ?? new Date(`${compra.data}T12:00:00`);

const montarLinhasItens = (compra: CompraHistorico) => {
  const descricaoLargura = 16;
  const qtdLargura = 5;
  const unitLargura = 8;
  const totalLargura = 9;

  const linhas = [
    "ITEM DESCRICAO       QTD  VL.UN  TOTAL",
  ];

  compra.items.forEach((item, index) => {
    const subtotal = item.quantidade * item.valorUnitario;
    const codigo = String(index + 1).padStart(3, "0");
    const descricaoLinhas = quebrarTexto(item.nome.toUpperCase(), descricaoLargura);

    descricaoLinhas.forEach((descricao, descricaoIndex) => {
      if (descricaoIndex === 0) {
        linhas.push(
          [
            preencherDireita(codigo, 4),
            preencherDireita(descricao, descricaoLargura + 1),
            preencherEsquerda(String(item.quantidade), qtdLargura),
            preencherEsquerda(formatarMoeda(item.valorUnitario), unitLargura),
            preencherEsquerda(formatarMoeda(subtotal), totalLargura),
          ].join("")
        );
        return;
      }

      linhas.push(`    ${descricao}`);
    });
  });

  return linhas;
};

const montarTextoCupom = (compra: CompraHistorico, usuarioNome?: string | null) => {
  const dataBase = obterDataBase(compra);
  const codigoCompra = gerarCodigoCompra(compra);
  const comprador = compra.completedBy ?? usuarioNome ?? "Nao informado";
  const linhasItens = montarLinhasItens(compra);
  const separador = "-".repeat(CUPOM_LARGURA);

  const linhas = [
    centralizar("SMARKET"),
    centralizar("Sistema Inteligente de Compras"),
    separador,
    `Data: ${formatarData(dataBase)}`,
    `Hora: ${formatarHora(dataBase)}`,
    "",
    `Compra Nº ${String(compra.id).padStart(6, "0")}`,
    `Codigo: ${codigoCompra}`,
    `Cliente: ${comprador}`,
    separador,
    ...linhasItens,
    separador,
    `${preencherDireita("Subtotal:", 20)} ${preencherEsquerda(`R$ ${formatarMoeda(compra.totalGasto)}`, 18)}`,
    separador,
    `${preencherDireita("TOTAL:", 20)} ${preencherEsquerda(`R$ ${formatarMoeda(compra.totalGasto)}`, 18)}`,
    separador,
    `Itens: ${String(compra.items.length).padStart(2, "0")}`,
    separador,
    centralizar("Obrigado pela preferencia!"),
    "",
    centralizar("SMarket"),
    centralizar("Smart Shopping Lists"),
    separador,
    centralizar("QR CODE DA COMPRA"),
    centralizar(codigoCompra),
  ];

  return {
    codigoCompra,
    texto: linhas.join("\n"),
  };
};

const montarHtmlCupom = async (compra: CompraHistorico, usuarioNome?: string | null) => {
  const { codigoCompra, texto } = montarTextoCupom(compra, usuarioNome);
  const qrCodeDataUrl = await QRCode.toDataURL(codigoCompra, {
    margin: 1,
    width: 180,
  });

  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          @page {
            size: 80mm auto;
            margin: 6mm 5mm;
          }
          body {
            margin: 0;
            padding: 0;
            background: #ffffff;
            color: #000000;
            font-family: "Courier New", Courier, monospace;
          }
          .cupom {
            width: 70mm;
            margin: 0 auto;
          }
          pre {
            margin: 0;
            white-space: pre-wrap;
            word-break: break-word;
            font-family: "Courier New", Courier, monospace;
            font-size: 11px;
            line-height: 1.38;
          }
          .qr-wrapper {
            margin-top: 10px;
            text-align: center;
          }
          .qr-wrapper img {
            width: 120px;
            height: 120px;
            object-fit: contain;
          }
        </style>
      </head>
      <body>
        <div class="cupom">
          <pre>${escaparHtml(texto)}</pre>
          <div class="qr-wrapper">
            <img src="${qrCodeDataUrl}" alt="QR Code da compra" />
          </div>
        </div>
      </body>
    </html>
  `;
};

export async function gerarPdfCompra(compra: CompraHistorico, usuarioNome?: string | null) {
  if (!compra.items.length) {
    throw new Error("Essa compra nao possui produtos para gerar o PDF.");
  }

  const html = await montarHtmlCupom(compra, usuarioNome);
  const arquivo = await Print.printToFileAsync({
    html,
    base64: false,
    width: 595,
    height: 1400,
  });

  return arquivo.uri;
}

export async function baixarOuCompartilharPdfCompra(
  compra: CompraHistorico,
  usuarioNome?: string | null
) {
  const uri = await gerarPdfCompra(compra, usuarioNome);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: "application/pdf",
      dialogTitle: "Baixar PDF da compra",
      UTI: "com.adobe.pdf",
    });
  }

  return uri;
}
