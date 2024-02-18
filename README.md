# eth-tx-tracer

This repository will provide a library for tracing Ethereum transactions. 

Specifically will be used for tracing pending transactions, with custom tracers / post-trace processing for:
- determining the event logs emitted in the traced transaction
- determining the state changes resulting from the traced transaction
- determining the addresses of contracts created as a result of the traced transaction
- caching the state changes from the traced transaction to use as state overrides in subsequent traces and calls

I seem to copy and paste code for this between projects I'm working on so frequently, that it makes sense to put all the features in their own library and perhaps even publish a package.

Note: this library will require a Geth node with the JSON-RPC interface exposed and the debug API enabled.

To use this library clone the repo:

```shell
git clone https://github.com/jjordan-quantum/eth-tx-tracer.git
```

Install deps:

```typescript
npm i
```

Compile:

```typescript
npm run build
```

Create a `.env` file in the repos base directory, with a single var of `JSON_RPC_URL` - this must be for a Geth node with debug api enabled.

Review and run the scripts in the `examples` dir to understand usage:

1. Using a balance override to simulate a transaction:

```shell
npx ts-node examples/balanceOverride.ts
```

2. Tracing an approval tx to cache the state changes and use the allowance in subsequent simulations:

```shell
npx ts-node examples/approvalOverride.ts
```

3. Tracing a swap tx and using the cached state changes to check token balance:

```shell
npx ts-node examples/swapState.ts
```

3. Tracing a swap tx and printing the logs that would have been emitted in the swap:

```shell
npx ts-node examples/swapLogs.ts
```
