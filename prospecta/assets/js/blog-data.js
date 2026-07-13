// =============================================================================
// PROSPECTA 4.0 — DADOS DO BLOG
// =============================================================================
//
// COMO ADICIONAR UMA NOVA PUBLICAÇÃO OU NOTÍCIA:
//
//   1. Copie o template abaixo
//   2. Cole NO INÍCIO do array BLOG_POSTS (posts mais recentes primeiro)
//   3. Salve e faça push — aparece automaticamente na página blog.html
//
// TEMPLATE:
// ─────────────────────────────────────────────────────────────────────────────
// {
//   id: 'slug-unico',       // sem espaços, use hífens, ex: 'minerais-criticos-2026'
//   type: 'noticia',        // 'publicacao' | 'noticia'
//   date: '2026-01-15',     // YYYY-MM-DD
//   src: 'Nome da fonte',   // ex: 'G1', 'XII SimeXmin · 2025', 'Prospecta 4.0'
//   ref: 'Ref opcional',    // número do artigo, edição etc — pode omitir
//   title: 'Título completo do post',
//   excerpt: 'Resumo curto que aparece no card (2-3 frases).',
//   body: 'Conteúdo completo exibido no modal. Pode ser longo.',
//   tags: ['Tag1', 'Tag2', 'Tag3'],
//   authors: 'Autor A · Autor B'  // opcional, apenas para publicações científicas
// },
// =============================================================================

var BLOG_POSTS = [

  // ── NOTÍCIAS ────────────────────────────────────────────────────────────────

  {
    id: 'lula-trump-minerais-2026',
    type: 'noticia',
    date: '2026-05-07',
    src: 'G1 · Globo',
    ref: '07 Mai 2026',
    title: 'Lula e Trump discutem potencial brasileiro em terras raras e minerais críticos na Casa Branca',
    excerpt: 'Lula afirmou que discutiu com Trump o potencial brasileiro na exploração de terras raras e minerais críticos, considerados estratégicos para a economia global.',
    body: 'Lula afirmou que discutiu com Trump o potencial brasileiro na exploração de terras raras e minerais críticos, considerados estratégicos para a economia global. Segundo Lula, o Brasil pretende ampliar o conhecimento sobre o próprio território e avançar na exploração desses recursos de forma planejada. O presidente disse que o país não quer repetir o modelo histórico de exportação de matéria-prima sem agregação de valor. De acordo com ele, a proposta é desenvolver a cadeia produtiva no Brasil, incluindo etapas de processamento e industrialização — criando empregos e renda no país em vez de exportar minério bruto.',
    tags: ['Terras-raras', 'Política mineral', 'Brasil', 'Trump · Lula']
  },

  {
    id: 'prospecta-antecipa-demanda',
    type: 'noticia',
    date: '2026-04-20',
    src: 'Prospecta 4.0',
    title: 'A pesquisa que antecipa o que o mundo vai precisar',
    excerpt: 'Enquanto governos negociam acesso a minerais críticos, o Prospecta 4.0 já mapeia e modela o potencial mineral da Bahia com IA e geotecnologias.',
    body: 'Enquanto governos negociam acesso a minerais críticos e estratégicos, o Prospecta 4.0 já mapeia e modela o potencial mineral da Bahia com ferramentas de inteligência artificial e geotecnologias. O projeto identifica áreas com ocorrência de terras-raras, fosfato, urânio, cromo e magnesita — exatamente os minerais no centro das disputas geopolíticas atuais. Ciência pública brasileira construindo vantagem estratégica antes que a demanda chegue.',
    tags: ['Prospecta 4.0', 'Minerais críticos', 'Bahia', 'IA & Geotecnologias']
  },

  // ── PUBLICAÇÕES CIENTÍFICAS ────────────────────────────────────────────────

  {
    id: 'fosfogenese-proterozoica-2025',
    type: 'publicacao',
    date: '2025-11-15',
    src: 'XII SimeXmin · 2025',
    ref: 'AT1-01-189',
    title: 'Fosfogênese Proterozoica do Cráton do São Francisco: Conexões com Eventos Globais Paleoproterozoicos e Neoproterozoicos e Implicações Exploratórias',
    excerpt: 'Revisão das condições paleoambientais das mineralizações de fosfato no Cráton do São Francisco, conectando eventos glaciais e biogeoquímicos do Proterozóico a janelas de formação de depósitos fosforíticos na Bahia.',
    body: 'Revisão das condições paleoambientais das mineralizações de fosfato no Cráton do São Francisco, conectando eventos glaciais e biogeoquímicos do Proterozóico a janelas específicas de formação de depósitos fosforíticos na Bahia. A recorrência dessas condições paleoambientais no Cráton do São Francisco sugere que a fosfogênese está condicionada a janelas específicas de transições climáticas globais e mudanças no estado redox dos oceanos ao longo do tempo geológico e da paleoproductividade oceânica.',
    authors: 'Ribeiro, T.S. · Franca-Rocha, W.S. · Oliveira, L.R. · Santana, A.V.A. · Misi, A.',
    tags: ['Fosfogênese', 'Proterozoico', 'Bahia', 'Cráton São Francisco']
  },

  {
    id: 'petrografia-apatita-skarn-2025',
    type: 'publicacao',
    date: '2025-11-15',
    src: 'XII SimeXmin · 2025',
    ref: 'AT1-01-190',
    title: 'Caracterização Petrográfica e Litogeoquímica de Granitoides Associados à Mineralização de Apatita em Ambiente Skarn no Complexo Tanque Novo – Ipirá, Bahia, Brasil',
    excerpt: 'Análise petrográfica e litogeoquímica de 10 amostras do Complexo Tanque Novo–Ipirá, identificando assinaturas composicionais distintas entre o núcleo e a borda das zonas de reação relacionadas à mineralização de apatita em skarn.',
    body: 'Análise petrográfica e litogeoquímica de 10 amostras do Complexo Tanque Novo–Ipirá, identificando assinaturas composicionais distintas entre o núcleo e a borda das zonas de reação relacionadas à mineralização de apatita em skarn. As rochas do núcleo apresentam composição dominada por quartzo (~50%) e ortoclásio (~30%), enquanto as amostras da borda exibem maior participação de piroxênio. A integração dos dados geoquímicos permite identificar diferenças mineralógicas e composicionais entre granitoides em posições distintas, indicando processos de evolução magmática e interação hidrotermal relacionados à mineralização fosforítica.',
    authors: 'Silva, L.C. · Ribeiro, T.S. · Franca-Rocha, W.S. · Brito, L.P.',
    tags: ['Petrografia', 'Litogeoquímica', 'Skarn', 'Apatita', 'Ipirá']
  },

  {
    id: 'predicao-fosforita-ifrece-2025',
    type: 'publicacao',
    date: '2025-11-15',
    src: 'XII SimeXmin · 2025',
    ref: 'AT1-01-191',
    title: 'Predição de Fosforita com Estratigrafia de Sequências, Assinaturas Geofísica e Geoquímica: Exemplo na Formação Salitre, Sub-Bacia de Irecê, Neoproterozoico, BA',
    excerpt: 'Uso de pFRX e gamaespectrometria portátil para identificação de sequências deposicionais e parâmetros preditivos de fosfato sedimentar na Sub-Bacia de Irecê, com integração de perfis colunares de alta resolução na Formação Salitre.',
    body: 'Uso de pFRX e gamaespectrometria portátil para identificação de sequências deposicionais e parâmetros preditivos de fosfato sedimentar na Sub-Bacia de Irecê, com integração de perfis colunares de alta resolução na Formação Salitre. Foram identificadas 8 sequências deposicionais com espessura métrica. Os dados de P₂O₅ mais expressivos foram obtidos na Sequência 8, associados à fácies Estromatólito dolomitizado. As concentrações de P₂O₅ e MgO indicam tendências correlativas com os dados geoquímicos, sugerindo que fosforitização ocorreu em zonas de rampa interna.',
    authors: 'Santana, A.V.A. · Lima, M.S. · Queiroz, G.S. · Freitas Jr., D.J. · Sousa, A.L. · Ribeiro, T.S. · Franca-Rocha, W.S.',
    tags: ['Estratigrafia', 'Fosforita', 'Irecê', 'Formação Salitre', 'Neoproterozoico']
  }

];
