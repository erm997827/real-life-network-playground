import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { initialState, useItem as applyItem, type Item, type Msg } from "@/lib/network-sim";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Real Life Networks — Add-on Minecraft Bedrock" },
      { name: "description", content: "Energia, servidor, Wi-Fi e rádio no seu mundo Minecraft Bedrock. Teste no simulador e baixe o script." },
      { property: "og:title", content: "Real Life Networks — Add-on Minecraft Bedrock" },
      { property: "og:description", content: "Energia, servidor, Wi-Fi e rádio no seu mundo. Teste no simulador e baixe." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const ITEMS: { id: Item; nome: string; icone: string; desc: string }[] = [
  { id: "gerador", nome: "Gerador", icone: "⚡", desc: "Liga/desliga a energia" },
  { id: "servidor", nome: "Servidor", icone: "🖥", desc: "Inicia/desliga o servidor" },
  { id: "roteador", nome: "Roteador", icone: "📶", desc: "Ativa o Wi-Fi (precisa de energia e servidor)" },
  { id: "radio", nome: "Rádio", icone: "📻", desc: "Fala com jogadores a até 64 blocos" },
  { id: "computador", nome: "Computador", icone: "💻", desc: "Mostra o status da rede" },
];

function Index() {
  const [state, setState] = useState(initialState);
  const [log, setLog] = useState<Msg[]>([{ kind: "broadcast", text: "Sistema Real Life Networks carregado!" }]);

  const usar = (item: Item) => {
    const r = applyItem(state, item);
    setState(r.state);
    setLog((l) => [...l, ...r.msgs].slice(-40));
  };

  return (
    <main className="min-h-screen grid-bg">
      <section className="mx-auto max-w-5xl px-5 pt-16 pb-10 text-center">
        <p className="text-sm text-accent">Add-on · Minecraft Bedrock</p>
        <h1 className="mt-2 text-6xl text-primary sm:text-8xl">Real Life Networks</h1>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Gerador, servidor, roteador Wi-Fi, rádio e computador — uma rede de verdade dentro do seu mundo.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a href="/real-life-networks-main.js" download className="pixel-btn bg-accent px-6 py-3 font-bold text-accent-foreground">
            Baixar script
          </a>
          <a href="#simulador" className="pixel-btn bg-secondary px-6 py-3 font-bold text-secondary-foreground">
            Testar no navegador
          </a>
        </div>
      </section>

      <section id="simulador" className="mx-auto max-w-5xl px-5 pb-16">
        <h2 className="mb-4 text-4xl text-gold">Simulador</h2>
        <div className="grid gap-5 md:grid-cols-[1fr_1.2fr]">
          <div className="pixel-panel p-4">
            <div className="mb-4 grid grid-cols-3 gap-2 text-center text-sm">
              {([["Energia", state.energia], ["Servidor", state.servidor], ["Wi-Fi", state.wifi]] as const).map(([n, on]) => (
                <div key={n} className="bg-muted p-2">
                  <div className="text-muted-foreground">{n}</div>
                  <div className={on ? "font-bold text-accent" : "font-bold text-destructive"}>{on ? "ON" : "OFF"}</div>
                </div>
              ))}
            </div>
            <div className="grid gap-2">
              {ITEMS.map((it) => (
                <button key={it.id} onClick={() => usar(it.id)} className="pixel-btn flex items-center gap-3 bg-secondary p-3 text-left hover:bg-muted">
                  <span className="text-2xl">{it.icone}</span>
                  <span>
                    <span className="block font-bold">{it.nome}</span>
                    <span className="block text-xs text-muted-foreground">{it.desc}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="pixel-panel flex flex-col p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Chat do jogo</span>
              <button onClick={() => setLog([])} className="text-xs text-muted-foreground hover:text-foreground">limpar</button>
            </div>
            <div className="h-96 overflow-y-auto bg-chat p-3 font-display text-xl leading-tight">
              {log.map((m, i) => (
                <div key={i}>
                  {m.kind === "broadcast" && (<><span className="text-primary">[NETWORKS] </span>{m.text}</>)}
                  {m.kind === "private" && <span className="text-destructive">{m.text}</span>}
                  {m.kind === "radio" && (<><span className="text-accent">[RÁDIO] </span>{m.text}</>)}
                  {m.kind === "info" && (
                    <span className={m.text.startsWith("===") ? "text-primary" : m.text.endsWith("ON") ? "text-accent" : m.text.endsWith("OFF") ? "text-destructive" : ""}>{m.text}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 pb-20">
        <h2 className="mb-4 text-4xl text-gold">Como instalar</h2>
        <ol className="pixel-panel list-decimal space-y-2 p-6 pl-10 text-sm text-muted-foreground">
          <li>Coloque o script em <span className="text-foreground">scripts/main.js</span> do seu behavior pack.</li>
          <li>Adicione o módulo <span className="text-foreground">@minecraft/server</span> nas dependências do manifest.</li>
          <li>Crie os itens net:gerador, net:servidor, net:roteador, net:radio e net:computador.</li>
          <li>Ative o pack no mundo e use os itens.</li>
        </ol>
      </section>
    </main>
  );
}
