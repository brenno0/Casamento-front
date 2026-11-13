import type { SitePublico } from './useSite';

/** Conteúdo fixo do site. Fotos servidas de `public/images/casal`. */
const foto = (arquivo: string) => `/images/casal/${arquivo}`;

export const FOTO_CAPA = { fotoUrl: foto('capa.jpg'), legenda: 'Nayane e Brenno' };

export const IGREJA_AQUARELA = foto('igreja.jpg');

/**
 * Capítulos da história, na ordem do painel: primeiro encontro, primeira viagem, o pedido.
 * O que estiver preenchido aqui substitui o do painel. `data` aceita `AAAA-MM-DD` ou só `AAAA-MM`.
 */
export const CAPITULOS: { fotoUrl: string; titulo?: string; data?: string; texto?: string }[] = [
  {
    fotoUrl: foto('primeiro-encontro.jpg'),
    titulo: 'O primeiro encontro',
    data: '2019-07',
    texto: `Éramos novos, e o plano era simples: cinema, pipoca e Toy Story. A Nayane foi de bota de plataforma, daquelas que a levavam do 1,50 ao 1,60. Ainda na fila, o salto se despediu.

Ela voltou do banheiro com botinhas de duende e o rosto corado, e a gente não parou mais de rir. Depois, um jantar na praça de alimentação e nenhum silêncio constrangedor.

Foi ali, no primeiro encontro, que a gente soube.`,
  },
  {
    fotoUrl: foto('primeira-viagem.jpg'),
    titulo: 'A primeira viagem juntos',
    data: '2023-09-03',
    texto: `A Nayane vivia dizendo que queria ir à praia. Juntamos dinheiro e fomos para Porto de Galinhas. Era o primeiro voo dela, e os dois embarcaram com medo; ela só se acalmou quando o Brenno mostrou que aquele avião nunca tinha caído.

O hotel não era dos melhores, e o cheiro da rua também não. No primeiro dia, o Brenno entrava no mar sem tirar os olhos da cadeira. Depois vieram Carneiros, Ponta Grossa, Maracaípe, um passeio de catamarã, jantares na vila e lembrancinhas para os nossos pais.

Numa das noites teve camarão servido no abacaxi, agridoce demais para o gosto dele, num jantar tão feliz que até hoje não sai da nossa cabeça.

Numa das últimas tardes, com o sol baixando, teve uma conversa na areia que fica só entre nós dois. Depois, um milkshake.`,
  },
  {
    fotoUrl: foto('pedido.jpg'),
    titulo: 'O pedido',
    data: '2026-01-17',
    texto: `Fazia uns dois anos que a Nayane pedia para ser pedida, com direito a indiretas dos pais e tudo. O Brenno não sabia bem como, mas deu um jeito: escolheu a aliança e planejou cada detalhe. Parque UNA, meio da tarde, a ponte sobre o laguinho e um amigo filmando de longe.

Ficou óbvio, claro. Ela percebeu na hora e, corada, repetia: "Não, mor, tá todo mundo olhando." Ela só tinha pedido uma coisa: que ele não se curvasse para a frente. De tão nervoso, ele esqueceu.

Ela chorou e disse sim, é claro. À noite, um jantar no Barolo para celebrar.`,
  },
];

/** Fotos fixas da galeria; as enviadas pelo painel entram depois. */
export const GALERIA_FIXA: SitePublico['galeria'] = Array.from({ length: 9 }, (_, i) => ({
  id: -(i + 1),
  fotoUrl: foto(`galeria-${i + 1}.jpg`),
  legenda: '',
}));

/** Dúvidas dos convidados. Substituem as do painel. */
export const DUVIDAS: SitePublico['faq'] = [
  {
    id: -1,
    pergunta: 'Quando e onde vai ser?',
    resposta:
      'No dia 17 de julho de 2027. A cerimônia começa às 16h e a festa vem logo depois. Endereços, mapas e rotas estão no link do convite que você recebeu.',
  },
  {
    id: -2,
    pergunta: 'Preciso confirmar presença?',
    resposta: 'Sim, e quanto antes, melhor. A confirmação é feita pelo link do seu convite, para cada pessoa do grupo.',
  },
  {
    id: -3,
    pergunta: 'Posso levar acompanhante?',
    resposta: 'O convite é nominal: quem está convidado aparece na confirmação de presença. Se tiver alguma dúvida, fale com a gente.',
  },
  {
    id: -4,
    pergunta: 'O que vestir?',
    resposta: 'As sugestões de traje e cores estão na seção Dress code, logo acima.',
  },
  {
    id: -5,
    pergunta: 'A que horas devo chegar?',
    resposta: 'Chegue com uns 20 minutos de antecedência. A cerimônia começa no horário, e a gente não quer que você perca o começo.',
  },
  {
    id: -6,
    pergunta: 'Como funciona a lista de presentes?',
    resposta:
      'Escolha um item na Lista de presentes. Dá para presentear pelo próprio site ou comprar na loja indicada e depois marcar "Já comprei", para ninguém repetir o presente.',
  },
  {
    id: -7,
    pergunta: 'Posso deixar um recado para os noivos?',
    resposta: 'Pode e vamos amar. O mural de recados fica no link do seu convite.',
  },
];

/** Locais do mapa no fim da página. `endereco: null` fica de fora até ser definido. */
export interface LocalMapa {
  tipo: 'cerimonia' | 'festa';
  titulo: string;
  endereco: string | null;
}

export const COMO_CHEGAR: LocalMapa[] = [
  {
    tipo: 'cerimonia',
    titulo: 'Cerimônia',
    endereco: 'Praça Nossa Senhora Aparecida, 100 - Nossa Senhora Aparecida, Uberlândia - MG',
  },
  // Festa: preencher o endereço quando o local estiver definido.
  { tipo: 'festa', titulo: 'Festa', endereco: null },
];
