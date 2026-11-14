import { world } from "@minecraft/server";

// REAL LIFE NETWORKS - Minecraft Bedrock Add-on

let energiaLigada = true;
let servidorLigado = true;
let wifiLigado = false;

function avisar(mensagem) {
    world.sendMessage("§b[NETWORKS] §f" + mensagem);
}

function distancia(a, b) {
    const x = a.location.x - b.location.x;
    const y = a.location.y - b.location.y;
    const z = a.location.z - b.location.z;
    return Math.sqrt(x*x + y*y + z*z);
}

world.afterEvents.itemUse.subscribe((event) => {
    const player = event.source;
    const item = event.itemStack;
    switch (item.typeId) {
        case "net:gerador":
            energiaLigada = !energiaLigada;
            avisar(energiaLigada ? "Energia elétrica ligada!" : "Energia elétrica desligada!");
            break;
        case "net:servidor":
            servidorLigado = !servidorLigado;
            avisar(servidorLigado ? "Servidor iniciado!" : "Servidor desligado!");
            break;
        case "net:roteador":
            if (!energiaLigada) { player.sendMessage("§cSem energia elétrica!"); return; }
            if (!servidorLigado) { player.sendMessage("§cServidor indisponível!"); return; }
            wifiLigado = !wifiLigado;
            avisar(wifiLigado ? "Rede Wi-Fi ativada!" : "Rede Wi-Fi desativada!");
            break;
        case "net:radio":
            if (!energiaLigada) { player.sendMessage("§cSem energia!"); return; }
            if (!servidorLigado) { player.sendMessage("§cComunicação indisponível!"); return; }
            for (const other of world.getAllPlayers()) {
                if (distancia(player, other) <= 64) {
                    other.sendMessage("§a[RÁDIO] §f" + player.name + ": Comunicação recebida!");
                }
            }
            break;
    }
});

world.afterEvents.itemUse.subscribe((event) => {
    if (event.itemStack.typeId === "net:computador") {
        const player = event.source;
        player.sendMessage("§b=== CENTRAL DE REDES ===");
        player.sendMessage("§fEnergia: " + (energiaLigada ? "§aON" : "§cOFF"));
        player.sendMessage("§fServidor: " + (servidorLigado ? "§aON" : "§cOFF"));
        player.sendMessage("§fWi-Fi: " + (wifiLigado ? "§aON" : "§cOFF"));
    }
});

avisar("Sistema Real Life Networks carregado!");
