// Child process for safety/process.test.ts. The dummy action only changes an in-memory counter.
import { envGuard } from '../../env/envGuard.ts';
import { currentEnv, getTarget, resolveTarget } from '../../env/target.ts';

const [mode, variable, value] = process.argv.slice(2);

let calls = 0;
const dummyAction = (): string => {
  calls += 1;
  return 'action-result';
};
const asyncDummyAction = async (): Promise<string> => dummyAction();

async function attempt(run: () => unknown): Promise<Record<string, unknown>> {
  try {
    return { threw: false, result: await run() };
  } catch (error) {
    return { threw: true, message: error instanceof Error ? error.message : String(error) };
  }
}

function print(result: unknown): void {
  console.log(JSON.stringify(result));
}

switch (mode) {
  case 'target': {
    // No try/catch: an invalid environment must end the process with a non-zero exit.
    const target = getTarget();
    print({
      name: target.name,
      baseURL: target.baseURL,
      currentEnv: currentEnv(),
      frozen: Object.isFrozen(target),
      pinned: getTarget() === target,
    });
    break;
  }
  case 'pure':
    print(resolveTarget());
    break;
  case 'guard-sync':
    print({ ...(await attempt(() => envGuard(dummyAction))), calls });
    break;
  case 'guard-async':
    print({ ...(await attempt(() => envGuard(asyncDummyAction))), calls });
    break;
  case 'pin-change': {
    getTarget();
    if (variable === undefined) throw new Error('pin-change needs a variable name.');
    if (value === undefined) delete process.env[variable];
    else process.env[variable] = value;
    print({
      getTarget: await attempt(() => getTarget()),
      currentEnv: await attempt(() => currentEnv()),
      envGuard: await attempt(() => envGuard(dummyAction)),
      calls,
    });
    break;
  }
  default:
    throw new Error('Unknown probe mode.');
}
