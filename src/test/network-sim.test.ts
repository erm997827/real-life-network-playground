import { describe, it, expect } from "vitest";
import { useItem, initialState } from "@/lib/network-sim";

describe("simulador", () => {
  it("roteador sem energia não liga o Wi-Fi", () => {
    const off = useItem(initialState, "gerador").state;
    const r = useItem(off, "roteador");
    expect(r.state.wifi).toBe(false);
    expect(r.msgs[0].text).toBe("Sem energia elétrica!");
  });
  it("roteador com servidor desligado avisa indisponível", () => {
    const off = useItem(initialState, "servidor").state;
    expect(useItem(off, "roteador").msgs[0].text).toBe("Servidor indisponível!");
  });
  it("roteador com tudo ligado ativa o Wi-Fi", () => {
    expect(useItem(initialState, "roteador").state.wifi).toBe(true);
  });
  it("rádio sem servidor fica indisponível", () => {
    const off = useItem(initialState, "servidor").state;
    expect(useItem(off, "radio").msgs[0].text).toBe("Comunicação indisponível!");
  });
});
