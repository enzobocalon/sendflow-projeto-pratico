import { httpsCallable, type HttpsCallableResult } from "firebase/functions";
import { functions } from "../lib/firebase";

export type MutationResponse = { id: string };

export const callFirebaseFunction = <Request, Response>(
  functionName: string,
  payload: Request,
): Promise<HttpsCallableResult<Response>> => {
  const callable = httpsCallable<Request, Response>(functions, functionName);

  return callable(payload);
};
