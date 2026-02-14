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
      },
    ) => Promise<{
      handler: () => Promise<unknown>;
    }>;
  };

  // VK ID SDK (UMD экспортирует VKID; в части сборок — VKIDSDK)
  VKID?: {
    Config: {
      init: (params: {
        app: number;
        redirectUrl: string;
        responseMode: string;
        source: string;
        scope: string;
      }) => void;
      ResponseMode: { Callback: string };
      Source: { LOWCODE: string };
    };
    OneTap: new () => VKIDWidget;
    Auth: { exchangeCode: (code: string, deviceId: string) => Promise<unknown> };
    WidgetEvents: { ERROR: string };
    OneTapInternalEvents: { LOGIN_SUCCESS: string };
  };
  VKIDSDK: {
    Config: {
      init: (params: {
        app: number;
        redirectUrl: string;
        responseMode: string;
        source: string;
        scope: string;
      }) => void;
      ResponseMode: {
        Callback: string;
      };
      Source: {
        LOWCODE: string;
      };
    };
    OneTap: new () => {
      render: (params: {
        container: string | HTMLElement;
        showAlternativeLogin: boolean;
        styles?: { borderRadius?: number };
      }) => VKIDWidget;
    };
    Auth: {
      exchangeCode: (code: string, deviceId: string) => Promise<unknown>;
    };
    WidgetEvents: {
      ERROR: string;
    };
    OneTapInternalEvents: {
      LOGIN_SUCCESS: string;
    };
  };
}

interface VKIDWidget {
  on: (event: string, callback: (payload: unknown) => void) => VKIDWidget;
}
