import {
  AppError,
  BadRequestError,
  InternalServerError,
  NotFoundError,
} from "@intmax2-function/shared";

export const processError = (statusCode: number, text: string) => {
  let error: AppError;
  switch (statusCode) {
    case 400:
      error = new BadRequestError(text);
      break;
    case 404:
      error = new NotFoundError(text);
      break;
    default:
      error = new InternalServerError(text);
  }

  throw error;
};
