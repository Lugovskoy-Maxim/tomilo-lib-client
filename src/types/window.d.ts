// Расширение глобального типа Window для Яндекс авторизации
interface Window {
  YaAuthSuggest: {
    init: (
      params: {
        client_id: string;
        response_type: string;
        redirect_uri: string;
      },
      origin: string,
      options: {
        view: string;
        parentId: string;
        buttonSize: string;
        buttonView: string;
        buttonTheme: string;
        buttonBorderRadius: string;
        buttonIcon: string;
      }
    ) => Promise<{
      handler: () => Promise<unknown>;
    }>;
  };
}