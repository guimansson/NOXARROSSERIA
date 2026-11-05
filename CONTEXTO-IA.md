# Contexto do projeto — NOX Arrosseria

Este arquivo explica o projeto para outra IA ou pessoa que vá revisar e ajustar o site. Leia-o antes de alterar os arquivos.

## Sobre o negócio e o site

- **Negócio:** NOX Arrosseria, restaurante em Besalú, Catalunha.
- **Site oficial:** https://noxarrosseria.com/
- **Objetivo atual:** testar a versão preparada no GitHub Pages, sem interromper nem substituir o site oficial que já está no domínio.
- **Tipo de site:** site estático; páginas HTML, CSS, fontes e imagens. Não há etapa de compilação nem dependências de pacote.
- **Idiomas:** catalão (página inicial), espanhol, inglês, francês e português.
- **Conteúdo:** páginas do restaurante, informações legais e página 404.

## Repositório e publicação

- **Repositório:** https://github.com/guimansson/NOXARROSSERIA
- **Branch publicada:** `main`
- **Configuração do Pages:** publicação a partir da branch `main`, pasta raiz (`/`).
- **Endereço temporário de teste:** https://guimansson.github.io/NOXARROSSERIA/
- O repositório está público para permitir o uso do GitHub Pages gratuito. Código e conteúdo podem ser vistos e copiados publicamente.
- O domínio oficial continua apontando para o site antigo. Não altere DNS, domínio personalizado ou a publicação oficial sem autorização explícita.

## Estrutura do site

- `index.html` — página inicial em catalão.
- `es/index.html`, `en/index.html`, `fr/index.html`, `pt/index.html` — páginas iniciais traduzidas.
- `privacitat/`, `avis-legal/`, `es/`, `en/`, `fr/` e `pt/` — páginas legais por idioma.
- `css/nox.css` — estilos e declarações de fontes.
- `fonts/` — fontes web usadas pelo CSS.
- `img/` — imagens, logotipos e ícones.
- `404.html` — página de erro 404.
- `sitemap.xml` e `robots.txt` — arquivos de indexação.
- `_headers` e `_redirects` vieram da distribuição anterior do site; o GitHub Pages não aplica essas regras como fazem alguns outros provedores.

## Regra importante para caminhos e domínio

O endereço de teste contém o nome do repositório (`/NOXARROSSERIA/`). Por isso, os caminhos internos atuais nas páginas e no CSS incluem esse prefixo, por exemplo:

```text
/NOXARROSSERIA/css/nox.css
/NOXARROSSERIA/img/...
```

Isso é necessário para carregar estilos e imagens no endereço de teste. **Não remova o prefixo enquanto o site estiver sendo testado nesse endereço.**

Quando houver autorização para migrar o domínio oficial, prepare e teste a versão de domínio próprio: os caminhos devem apontar para a raiz do domínio (por exemplo, `/css/nox.css` e `/img/...`), e as URLs canônicas, o sitemap e as referências de SEO devem corresponder ao endereço oficial. Configure o domínio personalizado no GitHub Pages e só altere o DNS após confirmar a versão e combinar a mudança. Preserve o site antigo durante os testes.

## Como fazer alterações com segurança

1. Identifique os arquivos de todos os idiomas que exibem o conteúdo alterado; mantenha textos e links coerentes entre as traduções.
2. Confira se os caminhos de CSS, imagens, fontes, páginas legais e navegação continuam funcionando no endereço temporário.
3. Use a página de teste para validar mudanças visuais e navegação antes de qualquer migração do domínio.
4. Não introduza dependências, ferramentas de compilação ou frameworks sem necessidade: a distribuição atual é HTML/CSS estático.
5. Não adicione senhas, tokens, dados privados ou credenciais ao repositório.
6. Preserve os arquivos e materiais de marca do projeto; não substitua fotos, textos, informações legais ou detalhes do restaurante sem confirmação.

## Cópia local

Esta pasta (`04-web/codi-font/`) contém os arquivos estáticos preparados para o endereço de teste. O pacote de produção original está em `04-web/produccio/noxarrosseria-web-2027-v2.zip`. Antes de reutilizar um ZIP para substituir arquivos, compare-o com a cópia atual: ele pode não conter ajustes feitos para o GitHub Pages.
