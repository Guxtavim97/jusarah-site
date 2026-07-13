# Jusarah Agro Aérea — site institucional (estático)

Site estático (HTML/CSS/JS, sem build). **Deploy zero-config na Vercel.**

## Estrutura
```
site/
├── index.html          # Home (one-page: hero, serviços, frota, empresa, certificações, Projeto Sementes, notícias, contato)
├── orcamento.html      # Formulário de orçamento (slider de hectares, estado→cidade, geolocalização, WhatsApp)
└── assets/
    ├── css/style.css   # Design system (verde/azul, componentes reaproveitáveis)
    ├── js/main.js       # Menu, contadores animados, WhatsApp, formulário, botão de emergência de incêndio
    └── img/             # logo.png, logo-branca.png, hero-aviao-decolagem.jpg, pulverizacao-lavoura.jpg, etc.
```

## Deploy na Vercel
1. Suba esta pasta (`site/`) para um repositório no GitHub.
2. Na Vercel: **Add New → Project → Import** o repo.
   - Framework Preset: **Other** (é estático, sem build).
   - Root Directory: raiz do repo (ou `site/` se subir o projeto inteiro).
   - Build Command: *(vazio)* · Output Directory: `.`
3. Deploy. Site no ar no `*.vercel.app`.
4. **Domínio:** Project → Settings → Domains → adicione `jusarah.com.br` e `www.jusarah.com.br`.
   Aponte no Registro.br conforme a Vercel indicar (A `76.76.21.21` + CNAME `cname.vercel-dns.com`, ou os nameservers da Vercel).

## Configuração rápida (editar depois)
- **WhatsApp / e-mail:** topo do `assets/js/main.js` (`window.JUSARAH`). Já configurado: `5569993257000` / `financeiro@voejusarah.com`.
- **Números dos contadores:** atributos `data-count` no `index.html`.
- **Registros ANAC/MAPA:** texto no `index.html` (provisórios `0000-0` / `0000/RO`).
- **Fotos:** substituir arquivos em `assets/img/` (mantendo os nomes) ou trocar os `src`.
- **Emergência de incêndio:** número em `tel:+5569993257000` e horário no bloco `.em-hours`.

## Notícias (próximo passo — à sua escolha)
- **Decap CMS** (Git-based, no próprio repo) → painel em `/admin`, commita no GitHub, Vercel re-publica.
- Ou headless (Sanity, Contentful, WP headless) puxando via API para a seção "Notícias".
- Ou um `/noticias` com posts em Markdown + um gerador estático.

Marca: azul royal `#1B3F8F` · verde `#5FB130` · azul céu `#2E86C1` · verde escuro `#1B6E3B`.
