# Fotos necessárias

Coloque as fotos reais nesta pasta (`site/assets/img/`) com os nomes abaixo.
Enquanto não houver fotos, o site mostra placeholders elegantes (gradientes verde/azul) que **não parecem quebrados**.

| Arquivo sugerido | Onde aparece | Dica |
|---|---|---|
| `logo.png` | Cabeçalho e rodapé | Fundo transparente, altura ~100px |
| `hero.jpg` | Fundo do banner principal (Home) | Foto aérea/aeronave, larga (≥1600px) |
| `empresa.jpg` | Página "A Empresa" | Aeronave, hangar ou equipe |
| `equipe-1.jpg` ... `equipe-4.jpg` | Seção "Conheça nossa equipe" | Retratos no dia a dia |
| `projeto-1.jpg` ... `projeto-6.jpg` | Galeria do Projeto Social | Ações realizadas |
| `noticia-capa.jpg` | Capas de notícias | Uma por notícia |
| `selo-anac.png`, `selo-mapa.png` | Certificações | Selos oficiais |

## Como trocar o placeholder por foto real (protótipo estático)

- **Logo:** em cada página, troque `<span class="brand__logo">J</span>` por
  `<img src="assets/img/logo.png" alt="Jusarah Agro Aérea" style="height:46px">`.
- **Hero:** no `assets/css/style.css`, no `.hero__bg`, descomente a linha
  `background: url('assets/img/hero.jpg') center/cover;`.
- **Demais fotos:** onde houver `<div class="photo">`, troque por
  `<img class="photo" src="assets/img/arquivo.jpg" alt="descrição">`.

> No **WordPress** nada disso é necessário — as fotos são trocadas pelo painel (ver `docs/03`).
