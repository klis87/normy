const isProduction = process.env.NODE_ENV === 'production';

export const warning = (show: boolean, ...messages: unknown[]) => {
  if (!isProduction) {
    if (show) {
      console.log(...messages);
    }
  }
};
