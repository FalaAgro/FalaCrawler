const cheerio = require('cheerio');
const axios = require('axios');

const API_ENDPOINT = 'api_link';

const estadosBrasil = {
  'Acre': 'AC',
  'Alagoas': 'AL',
  'Amapá': 'AP',
  'Amazonas': 'AM',
  'Bahia': 'BA',
  'Ceará': 'CE',
  'Distrito Federal': 'DF',
  'Espírito Santo': 'ES',
  'Goiás': 'GO',
  'Maranhão': 'MA',
  'Mato Grosso': 'MT',
  'Mato Grosso do Sul': 'MS',
  'Minas Gerais': 'MG',
  'Pará': 'PA',
  'Paraíba': 'PB',
  'Paraná': 'PR',
  'Pernambuco': 'PE',
  'Piauí': 'PI',
  'Rio de Janeiro': 'RJ',
  'Rio Grande do Norte': 'RN',
  'Rio Grande do Sul': 'RS',
  'Rondônia': 'RO',
  'Roraima': 'RR',
  'Santa Catarina': 'SC',
  'São Paulo': 'SP',
  'Sergipe': 'SE',
  'Tocantins': 'TO',
};

const capitaisBrasil = [
  'Rio Branco',
  'Maceió',
  'Macapá',
  'Manaus',
  'Salvador',
  'Fortaleza',
  'Brasília',
  'Vitória',
  'Goiânia',
  'São Luís',
  'Cuiabá',
  'Campo Grande',
  'Belo Horizonte',
  'Belém',
  'João Pessoa',
  'Curitiba',
  'Recife',
  'Teresina',
  'Rio de Janeiro',
  'Natal',
  'Porto Alegre',
  'Porto Velho',
  'Boa Vista',
  'Florianópolis',
  'São Paulo',
  'Aracaju',
  'Palmas',
];

const scrapeEmbrapa = async () => {
  try {
    const { data } = await axios.get('https://www.embrapa.br/busca-de-noticias');
    const $ = cheerio.load(data);

    const noticias = [];

    const newsElements = $('.table-data .conteudo');

    newsElements.each((index, element) => {
      const title = $(element).find('.titulo').text().trim();
      const resumo = $(element).find('.detalhes p').text().trim();
      const link = $(element).find('a').attr('href').replace(/\?.*/, '');

      noticias.push({ title, resumo, link });
    });

    for (const noticia of noticias) {
      const response = await axios.get(noticia.link);
      const $noticia = cheerio.load(response.data);

      const imagemPrincipal = $noticia('.imagem-principal img[src]').attr('data-src');
      const imagemCompleta = imagemPrincipal
        ? `https://www.embrapa.br/${imagemPrincipal}`
        : 'https://maissoja.com.br/wp-content/uploads/2015/06/Embrapa.jpg';

      const textoNoticia = $noticia('.texto-noticia')
        .text()
        .replace(/src="\/documents/g, 'src="https://www.embrapa.br/documents');

      let estadoEncontrado = '';
      let cidade = '';
      for (const estado in estadosBrasil) {
        if (textoNoticia.includes(estado)) {
          estadoEncontrado = estadosBrasil[estado];
          cidade = capitaisBrasil[Object.keys(estadosBrasil).indexOf(estado)];
          break;
        }
      }

      if (!estadoEncontrado) {
        continue;
      }

      console.log('Raspagem Embrapa');
      console.log('Título:', noticia.title);
      console.log('Resumo:', noticia.resumo);
      console.log('Texto da Notícia:', textoNoticia);
      console.log('Estado:', estadoEncontrado);
      console.log('Cidade:', cidade);
      console.log('Imagem:', imagemCompleta);
      console.log('---');

      try {
        const response = await axios.post(API_ENDPOINT, {
          title: noticia.title,
          content: textoNoticia,
          state: estadoEncontrado,
          city: cidade,
          type: 'news',
          image: imagemCompleta,
        });
        console.log('Post enviado:', response.data);
      } catch (error) {
        console.error('Erro ao enviar o post:', error);
      }
    }
  } catch (error) {
    console.error('Ocorreu um erro:', error);
  }
};

const scrapeGloboRural = async () => {
  try {
    const { data } = await axios.get('https://g1.globo.com/economia/agronegocios/globo-rural/');
    const $ = cheerio.load(data);

    const noticias = [];

    $('.feed-post-body').each((index, element) => {
      const title = $(element).find('a.feed-post-link').text().trim();
      const resumo = $(element).find('.feed-post-body-resumo').text().trim();
      const link = $(element).find('a.feed-post-link').attr('href');

      noticias.push({ title, resumo, link });
    });

    for (const noticia of noticias) {
      const response = await axios.get(noticia.link);
      const $noticia = cheerio.load(response.data);

      const imagemPrincipal = $noticia('.mc-article-body img').attr('src');
      const imagemCompleta = imagemPrincipal ? `${imagemPrincipal}` : '';

      const textoNoticia = $noticia('.mc-article-body p').text();

      let estadoEncontrado = '';
      let cidade = '';
      for (const estado in estadosBrasil) {
        if (textoNoticia.includes(estado)) {
          estadoEncontrado = estadosBrasil[estado];
          cidade = capitaisBrasil[Object.keys(estadosBrasil).indexOf(estado)];
          break;
        }
      }

      if (!estadoEncontrado) {
        continue;
      }

      console.log('Raspagem GloboRural');
      console.log('Título:', noticia.title);
      console.log('Resumo:', noticia.resumo);
      console.log('Texto da Notícia:', textoNoticia);
      console.log('Estado:', estadoEncontrado);
      console.log('Cidade:', cidade);
      console.log('Imagem:', imagemCompleta);
      console.log('---');

      try {
        const response = await axios.post(API_ENDPOINT, {
          title: noticia.title,
          content: textoNoticia,
          state: estadoEncontrado,
          city: cidade,
          type: 'news',
          image: imagemCompleta,
        });
        console.log('Post enviado:', response.data);
      } catch (error) {
        console.error('Erro ao enviar o post:', error);
      }
    }
  } catch (error) {
    console.error('Erro na raspagem do GloboRural:', error);
  }
};

const runScraping = async () => {
  await scrapeEmbrapa(); 
  await scrapeGloboRural(); 
};

runScraping();
