export function combineOverrides(firstOverrides: any, secondOverrides: any): any {
  let combinedOverrides: any = firstOverrides ? JSON.parse(JSON.stringify(firstOverrides)) : {};
  const _secondOverrides: any = secondOverrides ? JSON.parse(JSON.stringify(secondOverrides)) : {};
  const addresses = Object.keys(_secondOverrides);

  for(const address of addresses) {
    if(!combinedOverrides.hasOwnProperty(address)) {
      combinedOverrides[address] = {..._secondOverrides[address]};
      continue;
    }

    const keys =  Object.keys(_secondOverrides[address]);

    for(const key of keys) {
      if(key === 'stateDiff') {
        const slots = Object.keys(_secondOverrides[address].stateDiff);

        for(const slot of slots) {
          combinedOverrides[address].stateDiff[slot] = _secondOverrides[address].stateDiff[slot];
        }
      } else {
        combinedOverrides[address][key] = _secondOverrides[address][key];
      }
    }
  }

  return combinedOverrides;
}
