import { WithdrawalQueue } from "./withdrawalQueue";

export const bootstrap = () => {
  WithdrawalQueue.getInstance();
};
