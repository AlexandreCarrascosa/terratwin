# Créditos e licenças

| Componente               | Licença      |
| ------------------------ | ------------ |
| React / React DOM        | MIT          |
| TypeScript               | Apache-2.0   |
| Vite / Vitest            | MIT          |
| Three.js                 | MIT          |
| Leaflet                  | BSD-2-Clause |
| React Three Fiber / Drei | MIT          |
| Lucide                   | ISC          |
| Playwright               | Apache-2.0   |

As licenças completas das dependências diretas e transitivas acompanham os pacotes instalados. `package-lock.json` fixa as versões resolvidas; revisar licenças novamente ao atualizar dependências ou adicionar ativos.

Texturas, modelos geométricos e ícone do TerraTwin são gerados no projeto. Não utilizam imagens comerciais nem marcas de fabricantes ou empresas agrícolas. A fonte é a fonte de sistema do dispositivo; não há carregamento de fontes de terceiros.

A consulta opcional de clima atual usa [Open-Meteo](https://open-meteo.com/). Os dados consultados são atribuídos ao serviço sob [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), com link e instante na interface. O gerador e os dados da safra não usam Open-Meteo nem outro conjunto externo.

O mapa usa o mosaico EOxCloudless 2016 por EOX IT Services GmbH, contendo dados Copernicus Sentinel modificados de 2016, sob [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). A camada legada `s2cloudless_3857` é consumida diretamente do serviço público, sem copiar imagens para o repositório. [Licença, atribuição e condições](https://cloudless.eox.at/documentation/faq).

O fundo alternativo usa OpenStreetMap, com atribuição aos contribuidores e link para [copyright e ODbL](https://www.openstreetmap.org/copyright). O uso do serviço de tiles segue a [política da OSMF](https://operations.osmfoundation.org/policies/tiles/): carregamento interativo, sem prefetch, download em massa ou mapas offline. Os testes automatizados interceptam essas requisições e usam uma fixture local.

Imagens externas mantêm suas licenças próprias; a licença MIT do projeto não as substitui. Não há DEM real ou dados de CAR incluídos nesta versão.
