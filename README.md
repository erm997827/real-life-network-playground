# Real Life Network Playground

import { world } from "@minecraft/server";



// REAL LIFE NETWORKS

// Minecraft Bedrock Add-on



let energiaLigada = true;

let servidorLigado = true;

let wifiLigado = false;



// Mensagens para os jogadores

function avisar(mensagem) {

    world.sendMessage("§b[NETWORKS] §f" + mensagem);

}



// Distância entre jogadores

function distancia(a, b) {

    const x = a.location.x - b.location.x;

    const y = a.location.y - b.location.y;

    const z = a.location.z - b.location.z;



    return Math.sqrt(x*x + y*y + z*z);

}



// Utilização dos equipamentos

world.afterEvents.itemUse.subscribe((event) => {

    const player = event.source;

    const item = event.itemStack;



    switch (item.typeId) {



        // GERADOR DE ENERGIA

        case "net:gerador":

            energiaLigada = !energiaLigada;

            avisar(

                energiaLigada

                ? "Energia elétrica ligada!"

                : "Energia elétrica desligada!"

            );

            break;



        // SERVIDOR

        case "net:servidor":

            servidorLigado = !servidorLigado;

            avisar(

                servidorLigado

                ? "Servidor iniciado!"

                : "Servidor desligado!"

            );

            break;



        // ROTEADOR WI-FI

        case "net:roteador":

            if (!energiaLigada) {

                player.sendMessage("§cSem energia elétrica!");

                return;

            }



            if (!servidorLigado) {

                player.sendMessage("§cServidor indisponível!");

                return;

            }



            wifiLigado = !wifiLigado;



            avisar(

                wifiLigado

                ? "Rede Wi-Fi ativada!"

                : "Rede Wi-Fi desativada!"

            );

            break;



        // RÁDIO DE COMUNICAÇÃO

        case "net:radio":

            if (!energiaLigada) {

                player.sendMessage("§cSem energia!");

                return;

            }



            if (!servidorLigado) {

                player.sendMessage("§cComunicação indisponível!");

                return;

            }



            for (const other of world.getAllPlayers()) {

                if (

                    distancia(player, other) <= 64

                ) {

                    other.sendMessage(

                        "§a[RÁDIO] §f" +

                        player.name +

                        ": Comunicação recebida!"

                    );

                }

            }

            break;

    }

});



// Sistema de informações

world.afterEvents.itemUse.subscribe((event) => {

    if (event.itemStack.typeId === "net:computador") {

        const player = event.source;



        player.sendMessage("§b=== CENTRAL DE REDES ===");

        player.sendMessage("§fEnergia: " +

            (energiaLigada ? "§aON" : "§cOFF"));

        player.sendMessage("§fServidor: " +

            (servidorLigado ? "§aON" : "§cOFF"));

        player.sendMessage("§fWi-Fi: " +

            (wifiLigado ? "§aON" : "§cOFF"));

    }

});



avisar("Sistema Real Life Networks carregado!");

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/96ac4dff-0e05-4b48-b0cb-526090509300).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
