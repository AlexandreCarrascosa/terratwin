# Contribuir

O TerraTwin é um protótipo pessoal com dados públicos por definição. Mantenha fazendas, ativos, limites e números inteiramente fictícios. Não envie segredos ou dados reais em commits, Issues, anexos ou screenshots.

1. Crie uma branch para uma mudança de escopo claro.
2. Instale com `npm ci`.
3. Execute `npm test` e `npm run build`.
4. Se alterar navegação ou regras da safra, valide o percurso correspondente em `npm run test:e2e`.
5. Se alterar o gerador, regenere `src/data/dataset.json` e mantenha a saída reproduzível.
6. Atualize a documentação quando mudar comportamento, origem de dados ou limitações.

Não adicione um conector de sistema real direto no navegador. Proponha um contrato de leitura e uma PoC isolada primeiro. Alterações em conceitos agronômicos devem permanecer identificadas como ilustrativas até validação especializada.
