# Usina Ipiranga — interface web industrial (fase inicial)

## Nova página

`/industrial` mostra o estado real da conexão industrial retornado pelo backend FastAPI.

- Não há dados de tanques simulados.
- Sem API ou internet, mostra falha de consulta.
- Sem PLC/SCADA mapeado, mostra aguardando integração industrial.
- A aplicação é acessível no navegador; ainda não foi implantada em hospedagem pública.
- A tela usa JWT existente do aplicativo; não cria senhas ou usuários padrão.
- Rota do backend: `GET /api/industrial/status` e `GET /api/industrial/tags`.

## Configuração

Crie seu próprio `.env` baseado em `.env.example` e indique a URL real HTTPS do backend.
O backend deve ser publicado em ambiente controlado com CORS, JWT secreto, banco de dados e TLS.

## Segurança

O repositório tinha `.env` no Git. Arquivos removidos do branch continuam no histórico; rotacione quaisquer credenciais que tenham sido expostas antes de operar/publicar.

## Integração futura

A marca do PLC ainda é desconhecida. Usar uma camada de conectores compatível com OPC UA, Modbus TCP e gateways aprovados, sem expor rede industrial diretamente ao navegador. A IA não pode enviar comandos sem intertravamentos, comissionamento e aprovação formal.
