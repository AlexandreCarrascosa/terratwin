# Roteiro de apresentação · 15 minutos

## 1. Onde preciso olhar primeiro? · 3 min

Abra a aplicação na data inicial de demonstração, 12/03/2026. Apresente o selo **DADOS SIMULADOS** e o mapa geral: Aurora e Horizonte em referências regionais de Mato Grosso, Veredas no oeste da Bahia. Nenhuma unidade está selecionada inicialmente; os indicadores são consolidados. Clique no marcador ou cartão de Aurora para aproximar, abrir os detalhes e liberar o botão **Explorar em 3D**. O satélite é real e histórico (2016); talhões e ativos sobrepostos são fictícios. Alterne entre Mapa e 3D; volte ao conjunto com **Todas as unidades**.

Pergunta: “Consigo identificar qual fazenda precisa da minha atenção sem abrir várias planilhas?”

## 2. O que está acontecendo no talhão? · 3 min

Em Aurora, abra o alerta **MIP · Talhão 03**, ou use o atalho no guia. Troque entre as camadas Cultura, NDVI e Pragas. Abra o modo Tabela, busque “algodão” e selecione o talhão. Mostre a incidência de 72%, acima do limiar ilustrativo de 50%, e o painel de solo e fenologia.

Use a linha do tempo para avançar até 20/03. A aplicação fictícia encerra o surto. Não existe ordem agronômica real nem recomendação de produto/dose.

Pergunta: “O alerta me leva ao contexto necessário para investigar?”

## 3. Há capacidade para receber a colheita? · 3 min

Restaure a demonstração. Abra **Armazenagem**. Selecione o Silo 02 de Aurora: 39,8 °C, com referência a cabo e sensor fictícios. Mostre o nível proporcional e a capacidade livre. Troque para Horizonte para encontrar o alerta de ocupação.

Explique a distinção: o estoque de uma futura integração EWM seria por depósito/armazém; o nível por silo exigiria outra fonte e permaneceria identificado como medido ou estimado. Não existe integração nesta entrega.

Pergunta: “Em qual unidade o recebimento pode encontrar um gargalo?”

## 4. O que está parado e desde quando? · 2 min

Volte a Aurora e abra **Frota e manutenção**. Selecione a colhedora CL-01. Mostre a falha fictícia DTC DEMO-042 e a ordem corretiva OM-014. Avance para 18/03 para ver o encerramento do evento.

Pergunta: “O gestor consegue localizar a indisponibilidade e o contexto de manutenção?”

## 5. As metas estão evoluindo? · 3 min

Abra **Metas e conquistas**. Em Horizonte, veja “Plantio na janela” conquistada. Compare a colheita proporcional das três fazendas. Avance ao final da safra para mostrar 100% de colheita. Não há ranking individual.

Exporte um retrato CSV e, opcionalmente, consulte o clima público atual. Destaque que o clima de hoje em Cuiabá é uma referência separada do replay histórico fictício.

Perguntas para encerrar:

- Quem patrocinaria uma prova de valor com uma fazenda?
- Qual usuário-chave alimentaria e validaria os dados semanalmente?
- Qual decisão operacional precisa melhorar primeiro?
- Quais fontes reais e permissões estão disponíveis?

## Critério de avanço

Não confundir uma demonstração funcional com um sistema pronto para produção. Antes de investir em integrações: definir patrocinador e usuário-chave, validar acesso às APIs, obter geometrias autorizadas e confirmar critérios de valor. O próximo passo técnico é uma PoC isolada de fonte de dados, não conectar sistemas empresariais diretamente a este frontend público.
