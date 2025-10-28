"use client";

import { Footer, Header } from "@/widgets";
import { Upload, BookOpen, User, Tag, Calendar, FileText, Edit, Save, AlertCircle, Eye, Star, Users, AlertTriangle, Globe, LucideIcon } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store/index";
import { Title, TitleStatus } from "@/types/title";
import { updateTitle } from "@/store/slices/titlesSlice";
import { useParams } from "next/navigation";

// Конфигурация API
const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  genres: ["Фэнтези", "Романтика", "Приключения", "Драма", "Комедия", "Боевик", "Детектив", "Ужасы", "Научная фантастика", "Повседневность", "Психологическое", "Исторический", "Спокон", "Гарем", "Исекай", "Махва", "Манхва", "Сёнэн", "Сёдзе", "Сейнен"],
  tags: ["Магия", "Боевые искусства", "ГГ имба", "ГГ слабый", "Ромком", "Гарем", "Обратный гарем", "Трагедия", "Меха", "Зомби", "Вампиры", "Перерождение", "Попадание в другой мир", "Система", "Виртуальная реальность", "Школа", "Работа", "Музыка", "Спорт", "Кулинария"],
  ageLimits: [
    { value: 0, label: "0+ Для всех возрастов" },
    { value: 12, label: "12+ Для детей старше 12" },
    { value: 16, label: "16+ Для детей старше 16" },
    { value: 18, label: "18+ Только для взрослых" }
  ]
};

// Типы для пропсов компонентов
interface BasicInfoSectionProps {
  formData: Title;
  handleInputChange: (field: keyof Title) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleArrayFieldChange: (field: 'genres' | 'tags') => (value: string, isChecked: boolean) => void;
  handleAltNamesChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleImageChange: (e: ChangeEvent<HTMLInputElement>) => void;
  selectedFile: File | null;
}

interface StatsSectionProps {
  formData: Title;
}

interface ChaptersSectionProps {
  titleId: string;
  chaptersCount: number;
}

interface FormActionsProps {
  isSaving: boolean;
}

interface InputFieldProps {
  label: string;
  icon?: LucideIcon;
  type?: string;
  value: string | number;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  min?: string | number;
  max?: string | number;
  required?: boolean;
}

interface TextareaFieldProps {
  label: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
  required?: boolean;
}

interface SelectFieldProps {
  label: string;
  icon?: LucideIcon;
  value: string | number;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  options: Array<{ value: string | number; label: string }>;
}

interface CheckboxFieldProps {
  label: string;
  checked: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

interface CheckboxGroupProps {
  label: string;
  items: string[];
  selectedItems: string[];
  onChange: (value: string, isChecked: boolean) => void;
  icon?: LucideIcon;
}

interface ImageUploadFieldProps {
  label: string;
  image?: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  selectedFile: File | null;
}

interface ErrorStateProps {
  error: string;
}

// Загрузка данных
async function loadTitleData(id: string): Promise<Title | null> {
  try {
    const response = await fetch(`${API_CONFIG.baseUrl}/titles/${id}`);
    if (!response.ok) throw new Error('Title not found');
    return await response.json();
  } catch (error) {
    console.error('Error loading title:', error);
    return null;
  }
}

export default function TitleEditorPage() {
  const params = useParams();
  const titleId = params.id as string;
  
  const dispatch = useDispatch();
  const titlesState = useSelector((state: RootState) => state.titles);
  const existingTitle = titlesState.titles?.find(t => t._id === titleId);

  const [formData, setFormData] = useState<Title>({
    _id: "", name: "", altNames: [], description: "", genres: [], tags: [], artist: "", coverImage: "",
    status: TitleStatus.ONGOING, author: "", views: 0, totalChapters: 0, rating: 0, releaseYear: new Date().getFullYear(),
    ageLimit: 0, chapters: [], isPublished: false, createdAt: "", updatedAt: ""
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chaptersCount, setChaptersCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Загрузка данных
  useEffect(() => {
    const loadData = async () => {
      if (!titleId) {
        setError("ID тайтла не указан");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const titleData = existingTitle || await loadTitleData(titleId);
        if (titleData) {
          // Преобразуем числовые поля
          const processedData = {
            ...titleData,
            ageLimit: Number(titleData.ageLimit) || 0,
            releaseYear: Number(titleData.releaseYear) || new Date().getFullYear(),
            views: Number(titleData.views) || 0,
            totalChapters: Number(titleData.totalChapters) || 0,
            rating: Number(titleData.rating) || 0,
          };
          setFormData(processedData);
          try {
            // Загрузка количества глав
            const chaptersResponse = await fetch(`${API_CONFIG.baseUrl}/titles/${titleId}/chapters/count`);
            if (chaptersResponse.ok) {
              const countData = await chaptersResponse.json();
              setChaptersCount(countData.count || 0);
            } else {
              console.warn("Failed to load chapters count:", chaptersResponse.status);
              setChaptersCount(processedData.totalChapters || 0);
            }
          } catch (err) {
            console.error("Error loading chapters count:", err);
            setChaptersCount(processedData.totalChapters || 0);
          }
        } else {
          setError("Тайтл не найден");
        }
      } catch (err) {
        console.error('Error in loadData:', err);
        setError("Ошибка при загрузке данных тайтла");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [titleId, existingTitle]);

  // Обработчики
  const handleInputChange = (field: keyof Title) => (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const target = e.target as HTMLInputElement;
    let value: string | number | boolean = target.value;
    
    if (target.type === 'checkbox') {
      value = target.checked;
    } else if (target.type === 'number') {
      value = parseInt(target.value) || 0;
    }
    
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayFieldChange = (field: 'genres' | 'tags') => (value: string, isChecked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: isChecked ? [...prev[field], value] : prev[field].filter(item => item !== value)
    }));
  };

  const handleAltNamesChange = (e: ChangeEvent<HTMLInputElement>) => {
    const names = e.target.value.split(',').map(name => name.trim()).filter(name => name);
    setFormData(prev => ({ ...prev, altNames: names }));
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      // Создаем preview для изображения
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({ 
          ...prev, 
          coverImage: e.target?.result as string 
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // Создаем FormData для отправки файла
      const formDataToSend = new FormData();
      
      // Добавляем текстовые данные
      const textData = {
        ...formData,
        ageLimit: Number(formData.ageLimit),
        releaseYear: Number(formData.releaseYear),
        views: Number(formData.views),
        totalChapters: Number(chaptersCount),
        rating: Number(formData.rating),
        updatedAt: new Date().toISOString(),
      };

      // Удаляем coverImage из текстовых данных, если есть файл
      if (selectedFile) {
        delete textData.coverImage;
      }

      formDataToSend.append('data', JSON.stringify(textData));
      
      // Добавляем файл, если он выбран
      if (selectedFile) {
        formDataToSend.append('coverImage', selectedFile);
      }

      const response = await fetch(`${API_CONFIG.baseUrl}/titles/${titleId}`, {
        method: 'PUT',
        body: formDataToSend,
        // Не устанавливаем Content-Type - браузер сделает это автоматически с boundary
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to update title: ${response.status} - ${JSON.stringify(errorData)}`);
      }
      
      const updatedTitle = await response.json();
      dispatch(updateTitle(updatedTitle));
      setSelectedFile(null); // Сбрасываем выбранный файл после успешного сохранения
      alert('Тайтл успешно обновлен!');
    } catch (err) {
      console.error('Error updating title:', err);
      alert(`Ошибка при обновлении тайтла: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Состояния загрузки и ошибок
  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;

  return (
    <main className="min-h-screen bg-gradient-to-br from-[var(--background)] to-[var(--secondary)]">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-6">
        <HeaderSection />
        <form onSubmit={handleSubmit} className="space-y-6">
          <BasicInfoSection 
            formData={formData} 
            handleInputChange={handleInputChange}
            handleArrayFieldChange={handleArrayFieldChange}
            handleAltNamesChange={handleAltNamesChange}
            handleImageChange={handleImageChange}
            selectedFile={selectedFile}
          />
          <StatsSection formData={formData} />
          <ChaptersSection titleId={titleId} chaptersCount={chaptersCount} />
          <FormActions isSaving={isSaving} />
        </form>
      </div>
      <Footer />
    </main>
  );
}

// Компоненты состояний (без изменений)
function LoadingState() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[var(--background)] to-[var(--secondary)]">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)] mx-auto mb-4"></div>
            <p className="text-[var(--muted-foreground)]">Загрузка данных тайтла...</p>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}

function ErrorState({ error }: ErrorStateProps) {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[var(--background)] to-[var(--secondary)]">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">{error}</h1>
            <p className="text-[var(--muted-foreground)] mb-6">Не удалось загрузить данные тайтла для редактирования</p>
            <Link href="/admin/titles" className="px-6 py-3 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg font-medium hover:bg-[var(--primary)]/90 transition-colors">
              Вернуться к списку тайтлов
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}

// Компоненты секций
function HeaderSection() {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2 flex items-center gap-2">
        <Edit className="w-6 h-6" />
        Редактировать тайтл
      </h1>
      <p className="text-[var(--muted-foreground)]">Обновите информацию о тайтле</p>
    </div>
  );
}

function BasicInfoSection({ 
  formData, 
  handleInputChange, 
  handleArrayFieldChange, 
  handleAltNamesChange, 
  handleImageChange,
  selectedFile
}: BasicInfoSectionProps) {
  return (
    <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-6 space-y-6">
      <h2 className="text-xl font-semibold text-[var(--foreground)] flex items-center gap-2">
        <BookOpen className="w-5 h-5" />
        Основная информация
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <InputField 
            label="Название *" 
            value={formData.name} 
            onChange={handleInputChange("name")} 
            placeholder="Введите название тайтла" 
            required 
          />
        </div>
        
        <div className="md:col-span-2">
          <InputField 
            label="Альтернативные названия (через запятую)" 
            value={formData.altNames?.join(', ') || ''} 
            onChange={handleAltNamesChange} 
            placeholder="Альтернативные названия через запятую" 
            icon={Globe}
          />
        </div>

        <InputField 
          label="Автор" 
          value={formData.author || ''} 
          onChange={handleInputChange("author")} 
          placeholder="Автор произведения" 
          icon={User} 
        />
        
        <InputField 
          label="Художник" 
          value={formData.artist || ''} 
          onChange={handleInputChange("artist")} 
          placeholder="Художник" 
        />
        
        <InputField 
          label="Год выпуска *" 
          type="number" 
          value={formData.releaseYear} 
          onChange={handleInputChange("releaseYear")} 
          min="1900" 
          max={new Date().getFullYear() + 1}
          icon={Calendar}
          required
        />

        <SelectField 
          label="Статус *" 
          value={formData.status} 
          onChange={handleInputChange("status")} 
          options={Object.values(TitleStatus).map(status => ({ value: status, label: status }))}
        />

        <SelectField 
          label="Возрастное ограничение *" 
          value={formData.ageLimit} 
          onChange={handleInputChange("ageLimit")} 
          options={API_CONFIG.ageLimits}
          icon={AlertTriangle}
        />

        <CheckboxField 
          label="Опубликован" 
          checked={formData.isPublished} 
          onChange={handleInputChange("isPublished")} 
        />
      </div>

      <CheckboxGroup 
        label="Жанры" 
        items={API_CONFIG.genres} 
        selectedItems={formData.genres} 
        onChange={(value, checked) => handleArrayFieldChange('genres')(value, checked)}
        icon={Tag}
      />

      <CheckboxGroup 
        label="Теги" 
        items={API_CONFIG.tags} 
        selectedItems={formData.tags} 
        onChange={(value, checked) => handleArrayFieldChange('tags')(value, checked)}
      />

      <ImageUploadField 
        label="Обложка" 
        image={formData.coverImage} 
        onChange={handleImageChange}
        selectedFile={selectedFile}
      />

      <TextareaField 
        label="Описание *" 
        value={formData.description} 
        onChange={handleInputChange("description")} 
        placeholder="Описание тайтла..." 
        rows={4}
        required
      />
    </div>
  );
}
function StatsSection({ formData }: StatsSectionProps) {
  const stats: Array<{ 
    icon: LucideIcon; 
    value: string | number; 
    label: string; 
    color: 'blue' | 'green' | 'yellow' | 'purple' 
  }> = [
    { icon: Eye, value: formData.views.toLocaleString(), label: "Просмотры", color: "blue" },
    { icon: FileText, value: formData.totalChapters, label: "Глав", color: "green" },
    { icon: Star, value: formData.rating.toFixed(1), label: "Рейтинг", color: "yellow" },
    { icon: Users, value: formData.isPublished ? "Опубликован" : "Черновик", label: "Статус", color: "purple" },
  ];

  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600', 
    yellow: 'bg-yellow-100 text-yellow-600',
    purple: 'bg-purple-100 text-purple-600'
  };

  return (
    <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-6">
      <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4">Статистика</h2>
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="text-center p-4 bg-[var(--secondary)] rounded-lg">
            <div className={`flex items-center justify-center w-10 h-10 ${colorClasses[stat.color]} rounded-full mx-auto mb-2`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-lg font-bold text-[var(--foreground)]">{stat.value}</p>
            <p className="text-sm text-[var(--muted-foreground)]">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChaptersSection({ titleId, chaptersCount }: ChaptersSectionProps) {
  return (
    <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-[var(--foreground)] flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Управление главами
        </h2>
        <span className="text-lg font-bold text-[var(--primary)]">{chaptersCount} глав</span>
      </div>

      <div className="flex gap-3 flex-wrap">
        <Link href={`/admin/titles/${titleId}/chapters/add`} className="px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg font-medium hover:bg-[var(--primary)]/90 transition-colors flex items-center gap-2 text-sm">
          <Edit className="w-4 h-4" />
          Добавить главы
        </Link>

        <Link href={`/admin/titles/${titleId}/chapters`} className="px-4 py-2 bg-[var(--accent)] text-[var(--foreground)] rounded-lg font-medium hover:bg-[var(--accent)]/80 transition-colors flex items-center gap-2 text-sm">
          <FileText className="w-4 h-4" />
          Управление главами
        </Link>
      </div>

      <p className="text-sm text-[var(--muted-foreground)] mt-3">
        Добавляйте новые главы вручную или используйте парсинг из внешних источников
      </p>
    </div>
  );
}

function FormActions({ isSaving }: FormActionsProps) {
  return (
    <div className="flex justify-end gap-3">
      <Link href="/admin/titles" className="px-6 py-2 bg-[var(--accent)] text-[var(--foreground)] rounded-lg font-medium hover:bg-[var(--accent)]/80 transition-colors">
        Отмена
      </Link>
      <button 
        type="submit" 
        disabled={isSaving} 
        className="px-6 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg font-medium hover:bg-[var(--primary)]/90 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Save className="w-4 h-4" />
        {isSaving ? "Сохранение..." : "Сохранить"}
      </button>
    </div>
  );
}

// Базовые компоненты полей
function InputField({ label, icon: Icon, type = "text", ...props }: InputFieldProps) {
  return (
    <div>
      <label className="text-sm font-medium text-[var(--foreground)] mb-1 flex items-center gap-2">
        {Icon && <Icon className="w-3 h-3" />}
        {label}
      </label>
      <input 
        type={type}
        className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)] text-[var(--foreground)] text-sm" 
        {...props} 
      />
    </div>
  );
}

function TextareaField({ label, ...props }: TextareaFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--foreground)] mb-1">{label}</label>
      <textarea 
        className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)] text-[var(--foreground)] resize-none text-sm" 
        {...props} 
      />
    </div>
  );
}

function SelectField({ label, icon: Icon, options, ...props }: SelectFieldProps) {
  return (
    <div>
      <label className=" text-sm font-medium text-[var(--foreground)] mb-1 flex items-center gap-2">
        {Icon && <Icon className="w-3 h-3" />}
        {label}
      </label>
      <select 
        className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)] text-[var(--foreground)] text-sm" 
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  );
}

function CheckboxField({ label, ...props }: CheckboxFieldProps) {
  return (
    <div className="flex items-center">
      <label className="flex items-center gap-2 cursor-pointer">
        <input 
          type="checkbox" 
          className="w-4 h-4 text-[var(--primary)] bg-[var(--background)] border-[var(--border)] rounded focus:ring-[var(--primary)]" 
          {...props} 
        />
        <span className="text-sm font-medium text-[var(--foreground)]">{label}</span>
      </label>
    </div>
  );
}

function CheckboxGroup({ label, items, selectedItems, onChange, icon: Icon }: CheckboxGroupProps) {
  return (
    <div>
      <label className="text-sm font-medium text-[var(--foreground)] mb-2 flex items-center gap-2">
        {Icon && <Icon className="w-3 h-3" />}
        {label}
      </label>
      <div className="flex flex-wrap gap-1">
        {items.map((item: string) => (
          <label key={item} className="inline-flex items-center">
            <input 
              type="checkbox" 
              checked={selectedItems.includes(item)} 
              onChange={(e) => onChange(item, e.target.checked)} 
              className="hidden peer" 
            />
            <span className="px-2 py-1 rounded-full text-xs border border-[var(--border)] bg-[var(--accent)] text-[var(--foreground)] hover:border-[var(--primary)] transition-colors peer-checked:bg-[var(--primary)] peer-checked:text-[var(--primary-foreground)] peer-checked:border-[var(--primary)] cursor-pointer">
              {item}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

function ImageUploadField({ label, image, onChange, selectedFile }: ImageUploadFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--foreground)] mb-1">{label}</label>
      <div className="border border-dashed border-[var(--border)] rounded-lg p-3 text-center">
        <input 
          type="file" 
          accept="image/*" 
          onChange={onChange} 
          className="hidden" 
          id="image-upload" 
        />
        <label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center gap-1">
          <Upload className="w-6 h-6 text-[var(--muted-foreground)]" />
          <span className="text-xs text-[var(--muted-foreground)]">
            {selectedFile ? `Выбран файл: ${selectedFile.name}` : "Загрузить обложку"}
          </span>
          <span className="text-xs text-[var(--muted-foreground)]">
            {image && !selectedFile ? "Текущая обложка (загрузите новую для замены)" : "Нажмите для выбора файла"}
          </span>
        </label>
        {(image || selectedFile) && (
          <div className="mt-2">
            <img 
              src={`${process.env.NEXT_PUBLIC_URL}${image}`} 
              alt="Current cover" 
              className="max-w-[200px] mx-auto rounded" 
            />
            {selectedFile && (
              <p className="text-xs text-green-600 mt-1">Новое изображение будет загружено при сохранении</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}