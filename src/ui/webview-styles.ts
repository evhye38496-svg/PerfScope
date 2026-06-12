export function renderWebviewStyles(surface: 'dashboard' | 'sidebar'): string {
  const maxWidth = surface === 'dashboard' ? '1040px' : 'none';
  const padding = surface === 'dashboard' ? '24px' : '12px';

  return `
    :root {
      --turbo-radius: 8px;
      --turbo-radius-sm: 6px;
      --turbo-gap: 12px;
      --turbo-gap-lg: 18px;
      --turbo-motion: 180ms cubic-bezier(.2, .8, .2, 1);
      --turbo-border: var(--vscode-panel-border);
      --turbo-card: var(--vscode-editorWidget-background, var(--vscode-sideBar-background));
      --turbo-card-alt: var(--vscode-input-background, var(--vscode-editor-background));
      --turbo-text: var(--vscode-foreground);
      --turbo-muted: var(--vscode-descriptionForeground);
      --turbo-accent: var(--vscode-button-background);
      --turbo-accent-text: var(--vscode-button-foreground);
      --turbo-accent-hover: var(--vscode-button-hoverBackground);
      --turbo-focus: var(--vscode-focusBorder);
      --turbo-shadow: 0 8px 18px rgba(0, 0, 0, .16);
    }

    * { box-sizing: border-box; }
    body {
      font-family: var(--vscode-font-family);
      color: var(--turbo-text);
      background: ${surface === 'dashboard' ? 'var(--vscode-editor-background)' : 'var(--vscode-sideBar-background)'};
      margin: 0;
    }
    main {
      max-width: ${maxWidth};
      padding: ${padding};
    }
    h1, h2, h3, p { margin: 0; }
    h1 { font-size: ${surface === 'dashboard' ? '24px' : '15px'}; font-weight: 700; }
    h2 { font-size: 15px; margin-bottom: 10px; }
    h3 { font-size: 13px; margin-bottom: 4px; }
    p { color: var(--turbo-muted); line-height: 1.45; }

    .launcher-shell {
      display: grid;
      gap: var(--turbo-gap-lg);
      animation: turbo-enter var(--turbo-motion);
    }
    .hero-grid {
      display: grid;
      grid-template-columns: minmax(220px, 1.15fr) minmax(240px, .85fr);
      gap: var(--turbo-gap);
      align-items: stretch;
    }
    .card, .panel-card, .issue-card, .metric-card {
      background: var(--turbo-card);
      border: 1px solid var(--turbo-border);
      border-radius: var(--turbo-radius);
      box-shadow: 0 0 0 rgba(0, 0, 0, 0);
      transition: transform var(--turbo-motion), box-shadow var(--turbo-motion), border-color var(--turbo-motion), background-color var(--turbo-motion);
    }
    .card:hover, .panel-card:hover, .issue-card:hover, .metric-card:hover {
      transform: translateY(-1px);
      box-shadow: var(--turbo-shadow);
      border-color: var(--turbo-focus);
    }
    .score-hero {
      padding: ${surface === 'dashboard' ? '18px' : '12px'};
      display: grid;
      gap: 12px;
    }
    .score-line {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 12px;
    }
    .score-value {
      font-size: ${surface === 'dashboard' ? '60px' : '38px'};
      line-height: 1;
      font-weight: 800;
    }
    .score-grade {
      color: var(--turbo-muted);
      font-size: ${surface === 'dashboard' ? '16px' : '12px'};
      padding-bottom: 5px;
    }
    .score-meter {
      height: 8px;
      overflow: hidden;
      border-radius: 999px;
      background: var(--vscode-progressBar-background, var(--turbo-card-alt));
      border: 1px solid var(--turbo-border);
    }
    .score-meter-fill {
      width: var(--score, 0%);
      height: 100%;
      border-radius: inherit;
      background: var(--turbo-accent);
      transition: width var(--turbo-motion);
    }
    .launcher-actions {
      display: grid;
      gap: 8px;
      align-content: start;
    }
    .toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .action-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 30px;
      border: 1px solid var(--vscode-button-border, transparent);
      border-radius: var(--turbo-radius-sm);
      padding: 5px 11px;
      color: var(--turbo-accent-text);
      background: var(--turbo-accent);
      cursor: pointer;
      text-align: center;
      transition: transform var(--turbo-motion), background-color var(--turbo-motion), box-shadow var(--turbo-motion);
    }
    .action-button:hover {
      transform: translateY(-1px);
      background: var(--turbo-accent-hover);
      box-shadow: var(--turbo-shadow);
    }
    .action-button:active {
      transform: translateY(0);
      box-shadow: none;
    }
    .action-button.secondary {
      color: var(--vscode-button-secondaryForeground, var(--turbo-text));
      background: var(--vscode-button-secondaryBackground, var(--turbo-card-alt));
      border-color: var(--turbo-border);
    }
    .action-button.secondary:hover {
      background: var(--vscode-button-secondaryHoverBackground, var(--turbo-card));
    }
    .primary-action {
      min-height: ${surface === 'dashboard' ? '42px' : '34px'};
      font-weight: 700;
    }
    .section-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
      gap: var(--turbo-gap);
    }
    .panel-card, .metric-card, .issue-card {
      padding: 12px;
    }
    .metric-card span, .eyebrow {
      display: block;
      color: var(--turbo-muted);
      font-size: 12px;
      margin-bottom: 3px;
    }
    .metric-card strong {
      font-size: 18px;
    }
    .issue-list {
      display: grid;
      gap: 8px;
    }
    .tag-row {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 8px;
    }
    .tag {
      border: 1px solid var(--turbo-border);
      border-radius: 999px;
      color: var(--turbo-muted);
      padding: 2px 7px;
      font-size: 11px;
    }
    .critical { border-left: 4px solid var(--vscode-errorForeground); }
    .warning { border-left: 4px solid var(--vscode-editorWarning-foreground); }
    .info { border-left: 4px solid var(--vscode-editorInfo-foreground); }
    .muted, .empty { color: var(--turbo-muted); }

    @keyframes turbo-enter {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @media (max-width: 680px) {
      .hero-grid { grid-template-columns: 1fr; }
      .toolbar { display: grid; grid-template-columns: 1fr; }
      .action-button { width: 100%; }
    }

    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation: none !important;
        transition: none !important;
        transform: none !important;
      }
    }
  `;
}
