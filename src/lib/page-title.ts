// lib/page-title.ts
class PageTitleHelper {
  private defaultTitle = 'Tomilo-lib.ru - Современная платформа для чтения маньхуя и комиксов';
  private separator = ' | ';

  setTitle(title: string) {
    if (typeof document !== 'undefined') {
      document.title = title;
      // document.title = title + this.separator + this.defaultTitle;

    }
  }

  setTitleOnly(title: string) {
    if (typeof document !== 'undefined') {
      document.title = title;
    }
  }

  setTitleWithSuffix(title: string, suffix: string) {
    if (typeof document !== 'undefined') {
      document.title = title;
    }
  }

  getTitle(): string {
    if (typeof document !== 'undefined') {
      return document.title;
    }
    return this.defaultTitle;
  }

  resetTitle() {
    if (typeof document !== 'undefined') {
      document.title = this.defaultTitle;
    }
  }

  // Для динамических страниц с фильтрами
  setSearchTitle(searchQuery: string, resultsCount?: number) {
    let title = 'Каталог тайтлов';
    
    if (searchQuery) {
      title = `Поиск: "${searchQuery}"`;
      if (resultsCount !== undefined) {
        title += ` (${resultsCount} результатов)`;
      }
    }
    
    this.setTitle(title);
  }

  // Для страниц тайтлов
  setTitlePage(titleName: string) {
    this.setTitle(titleName);
  }

  // Для страниц чтения
  setReadingTitle(titleName: string, chapter?: string) {
    let title = titleName;
    if (chapter) {
      title += ` - Глава ${chapter}`;
    }
    this.setTitle(title);
  }
}

export const pageTitle = new PageTitleHelper();