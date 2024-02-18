# eth-tx-tracer

This repository will provide a library for tracing Ethereum transactions. 

Specifically will be used for tracing pending transactions, with custom tracers / post-trace processing for:
- determining the event logs emitted in the traced transaction
- determining the state changes resulting from the traced transaction
- determining the addresses of contracts created as a result of the traced transaction
- caching the state changes from the traced transaction to use as state overrides in subsequent traces and calls

I seem to copy and paste code for this between projects I'm working on so frequently, that it makes sense to put all the features in their own library and perhaps even publish a package.

Note: this library will require a Geth node with the JSON-RPC interface exposed and the debug API enabled.

Example usage and tests cases coming soon...
