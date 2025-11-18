# Changelog

## 0.2.0 - 2025-11-18

### Added
- Modo compacto padrão: todo comando agora imprime um bloco único com resultado, bullets relevantes e lembrete para usar `--full` quando quiser o log completo.
- Flag `--details`: disponível para qualquer comando, mostrando um preview truncado do stdout/stderr antes de recorrer ao `--full`.
- Utilitário `blocks` reutilizável para formatação consistente entre plugins.

### Changed
- O plugin do npm agora captura métricas de auditoria, vulnerabilidades, funding e pacotes depreciados dentro do bloco premium.
- Resumos genéricos incorporam automaticamente avisos de saída silenciada (linhas stdout/stderr + flags) como bullet adicional.
- Documentação atualizada para refletir o novo fluxo e exemplos reais do bloco compacto.

### Fixed
- Tests de regressão cobrindo o novo formato foram adicionados/ajustados, garantindo que futuros plugins respeitem o padrão compacto.
