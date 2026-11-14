export type NetState = { energia: boolean; servidor: boolean; wifi: boolean };
export type Msg = { kind: "broadcast" | "private" | "radio" | "info"; text: string };
export type Item = "gerador" | "servidor" | "roteador" | "radio" | "computador";

export const initialState: NetState = { energia: true, servidor: true, wifi: false };

export function useItem(s: NetState, item: Item, player = "Steve"): { state: NetState; msgs: Msg[] } {
  switch (item) {
    case "gerador": {
      const energia = !s.energia;
      return { state: { ...s, energia }, msgs: [{ kind: "broadcast", text: energia ? "Energia elétrica ligada!" : "Energia elétrica desligada!" }] };
    }
    case "servidor": {
      const servidor = !s.servidor;
      return { state: { ...s, servidor }, msgs: [{ kind: "broadcast", text: servidor ? "Servidor iniciado!" : "Servidor desligado!" }] };
    }
    case "roteador": {
      if (!s.energia) return { state: s, msgs: [{ kind: "private", text: "Sem energia elétrica!" }] };
      if (!s.servidor) return { state: s, msgs: [{ kind: "private", text: "Servidor indisponível!" }] };
      const wifi = !s.wifi;
      return { state: { ...s, wifi }, msgs: [{ kind: "broadcast", text: wifi ? "Rede Wi-Fi ativada!" : "Rede Wi-Fi desativada!" }] };
    }
    case "radio": {
      if (!s.energia) return { state: s, msgs: [{ kind: "private", text: "Sem energia!" }] };
      if (!s.servidor) return { state: s, msgs: [{ kind: "private", text: "Comunicação indisponível!" }] };
      return { state: s, msgs: [{ kind: "radio", text: `${player}: Comunicação recebida!` }] };
    }
    case "computador":
      return {
        state: s,
        msgs: [
          { kind: "info", text: "=== CENTRAL DE REDES ===" },
          { kind: "info", text: `Energia: ${s.energia ? "ON" : "OFF"}` },
          { kind: "info", text: `Servidor: ${s.servidor ? "ON" : "OFF"}` },
          { kind: "info", text: `Wi-Fi: ${s.wifi ? "ON" : "OFF"}` },
        ],
      };
  }
}
