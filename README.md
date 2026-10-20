# USINA IPIRANGA — CENTRO DE OPERAÇÕES INTELIGENTE

Plataforma web industrial em React. Acesse /operations após login.

## Módulos implementados

- COI: áreas, inventário, saúde do gateway, indicadores, gráfico por área e alarmes.
- Gráficos: 4 tendências independentes de medições reais, 1h/8h/24h/7d/30d, limites de aviso e exportação CSV.
- Tanques: leitura real válida, sem gerar níveis fictícios.
- Equipamentos: buscas, filtro por área/categoria e tags vinculadas.
- Controle: PV/SP/MV; modo manual, supervisório e automático registrado como PLANEJAMENTO, sem escrita física.
- Alarmes: histórico, prioridades e reconhecimento auditado.
- Engenharia: cadastro de áreas, equipamentos, tags, limites e malhas.
- IA: análise externa opcional apenas com aprovação da empresa e dados reais.
- Auditoria: registros de cadastros, mudanças pretendidas e reconhecimentos.
- Comunicação: WebSocket autenticado com dados persistidos, mais consulta HTTP de reserva.

## Instalação local

1. Instale Node.js 20+ e execute `npm ci --legacy-peer-deps`.
2. Crie o arquivo `.env` local com `REACT_APP_BACKEND_URL=http://localhost:8000`.
3. Inicie o backend FastAPI do projeto `ipiranga-backend` e execute `npm start`.
4. Após login, abra `http://localhost:3000/operations`.
5. Para gerar versão de distribuição web, execute `npm run build`.

## Segurança e limitações

Não existem dados de processo fictícios, comandos para PLC nem integração com CLP/SCADA nesta fase.
Sem telemetria real, os gráficos ficam vazios e o sistema informa que aguarda integração.
Escolher modo AUTOMÁTICO não ativa controle físico: fica `NAO_COMISSIONADO` até validação OT.
O WebSocket não é determinístico e não pode controlar equipamentos industriais.
Segredos expostos em arquivos `.env` do histórico antigo devem ser revogados e substituídos.
Implantação requer TLS/HTTPS, MongoDB seguro, RBAC, aprovação de segurança e comissionamento.

Esta plataforma é um projeto de desenvolvimento, não uma implantação industrial oficialmente validada.
