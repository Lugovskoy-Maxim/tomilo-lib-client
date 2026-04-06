"use client";

import { useState, useMemo } from "react";
import {
  useGetAlchemyRecipesQuery,
  useGetAlchemyStatusQuery,
  useAlchemyCraftMutation,
  useAlchemyUpgradeCauldronMutation,
  useGetAlchemyShopQuery,
  useRefreshAlchemyShopMutation,
  useBuyAlchemyItemMutation,
  useGetDisciplesGameShopQuery,
  useDisciplesGameShopBuyMutation,
  useGetProfileDisciplesQuery,
} from "@/store/api/gamesApi";
import { useToast } from "@/hooks/useToast";
import { getErrorMessage } from "@/lib/utils";
import { FlaskConical, Sparkles, Coins, ShoppingBag, Search, Filter, SortAsc } from "lucide-react";
import Tooltip from "@/shared/ui/Tooltip";
import Input from "@/shared/ui/input";

import { GameResultReveal } from "./GameResultReveal";
import { GAME_ART } from "./gameArt";
import { GameItemExchangePanel } from "./GameItemExchangePanel";

export function AlchemySection() {
  const toast = useToast();
  const { data: recipesData, isLoading: recipesLoading, isError: recipesError } = useGetAlchemyRecipesQuery();
  const { data: statusData } = useGetAlchemyStatusQuery();
  const { data: shopData } = useGetDisciplesGameShopQuery();
  const { data: disciplesProfile } = useGetProfileDisciplesQuery();
  const { data: alchemyShopData, isLoading: alchemyShopLoading } = useGetAlchemyShopQuery();
  const [refreshAlchemyShop, { isLoading: isRefreshingShop }] = useRefreshAlchemyShopMutation();
  const [buyAlchemyItem, { isLoading: isBuyingAlchemyItem }] = useBuyAlchemyItemMutation();
  const [buyShopOffer, { isLoading: isBuyingShop }] = useDisciplesGameShopBuyMutation();
  const [craft, { isLoading: isCrafting }] = useAlchemyCraftMutation();
  const [upgradeCauldron, { isLoading: isUpgrading }] = useAlchemyUpgradeCauldronMutation();
  const [reveal, setReveal] = useState<{
    open: boolean;
    title: string;
    subtitle?: string;
    heroImage?: string;
    items?: { itemId: string; count: number; name?: string; icon?: string }[];
    rewards?: { exp?: number; coins?: number };
    tone: "success" | "warning";
  }>({ open: false, title: "", tone: "success" });

  // Фильтрация и сортировка
  const [searchQuery, setSearchQuery] = useState("");
  const [elementFilter, setElementFilter] = useState<string | "all">("all");
  const [sortBy, setSortBy] = useState<"name" | "coinCost" | "mishap" | "element">("name");

  const recipes = (recipesData?.data?.recipes ?? []) as Array<{
    _id: string;
    name: string;
    description: string;
    icon: string;
    coinCost: number;
    ingredients: { itemId: string; count: number; have: number; name?: string; icon?: string }[];
    resultType: string;
    resultPreview?: {
      common?: { itemId: string; name?: string; icon?: string };
      quality?: { itemId: string; name?: string; icon?: string };
      legendary?: { itemId: string; name?: string; icon?: string };
    };
    element?: string | null;
    mishapChancePercent?: number;
    effectiveMishapChancePercent?: number;
    canCraft: boolean;
  }>;
  const status = statusData?.data;
  const canCraft = status?.canCraft ?? false;
  const shopOffers = shopData?.data?.offers ?? [];
  const coinBalance = disciplesProfile?.data?.balance ?? 0;

  // Фильтрация и сортировка рецептов
  const filteredRecipes = useMemo(() => {
    let filtered = [...recipes];
    // Поиск по названию или описанию
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.name.toLowerCase().includes(query) ||
        (r.description && r.description.toLowerCase().includes(query))
      );
    }
    // Фильтр по стихии
    if (elementFilter !== "all") {
      filtered = filtered.filter(r => r.element === elementFilter);
    }
    // Сортировка
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "coinCost":
          return a.coinCost - b.coinCost;
        case "mishap": {
          const mishapA = a.effectiveMishapChancePercent ?? a.mishapChancePercent ?? 0;
          const mishapB = b.effectiveMishapChancePercent ?? b.mishapChancePercent ?? 0;
          return mishapA - mishapB;
        }
        case "element": {
          const elementA = a.element ?? "";
          const elementB = b.element ?? "";
          return elementA.localeCompare(elementB);
        }
        default:
          return 0;
      }
    });
    return filtered;
  }, [recipes, searchQuery, elementFilter, sortBy]);

  const handleBuyShop = async (offerId: string) => {
    try {
      const result = await buyShopOffer({ offerId }).unwrap();
      const lib = result?.data?.library;
      toast.success(
        lib
          ? `Куплено. Библиотека: ур.${lib.level}, опыт ${lib.exp}`
          : "Покупка выполнена",
      );
    } catch (e: unknown) {
      toast.error(getErrorMessage(e, "Не удалось купить"));
    }
  };

  const handleRefreshAlchemyShop = async () => {
    try {
      const result = await refreshAlchemyShop().unwrap();
      toast.success("Ассортимент лавки обновлён");
    } catch (e: unknown) {
      toast.error(getErrorMessage(e, "Не удалось обновить лавку"));
    }
  };

  const handleBuyAlchemyItem = async (index: number, directPurchase?: boolean) => {
    try {
      const result = await buyAlchemyItem({ index, directPurchase }).unwrap();
      const itemName = alchemyShopData?.data?.assortment?.[index]?.name || "товар";
      const price = result.data?.pricePaid ?? 0;
      toast.success(`Куплено: ${itemName} за ${price} монет`);
    } catch (e: unknown) {
      toast.error(getErrorMessage(e, "Не удалось купить товар"));
    }
  };

  const handleCraft = async (recipeId: string) => {
    try {
      const result = await craft(recipeId).unwrap();
      const q = result?.data?.quality;
      const mishap = result?.data?.mishap;
      const items = result?.data?.itemsGained?.length
        ? ` · +${result.data.itemsGained.map(i => `${i.name || i.itemId}×${i.count}`).join(", ")}`
        : "";
      const left = typeof result?.data?.alchemy?.attemptsLeft === "number"
        ? ` · попыток осталось: ${result.data.alchemy.attemptsLeft}`
        : "";
      if (result?.data?.success === false && mishap?.happened) {
        setReveal({
          open: true,
          title: "Котёл сорвался",
          subtitle: "Попытка потрачена, но вы всё равно получили утешительные награды и опыт алхимика.",
          heroImage: GAME_ART.alchemy.mishap,
          rewards: result?.data?.rewards,
          items: result?.data?.itemsGained,
          tone: "warning",
        });
        toast.error(
          `Котёл сорвался (риск ${mishap.chancePercent ?? "?"}%). ` +
            `Утешение: +${result?.data?.rewards?.exp ?? 0} опыта, +${result?.data?.rewards?.coins ?? 0} монет${left}`,
        );
        return;
      }

      const saved =
        mishap?.happened && mishap?.preventedByStabilizer
          ? " · стабилизатор спас варку"
          : "";

      toast.success(
        q
          ? `Варка: ${q === "legendary" ? "Легендарное" : q === "quality" ? "Улучшенное" : "Обычное"} качество. +${result?.data?.rewards?.exp ?? 0} опыта, +${result?.data?.rewards?.coins ?? 0} монет${items}${saved}${left}`
          : "Варка завершена",
      );
      setReveal({
        open: true,
        title:
          q === "legendary"
            ? "Легендарная варка"
            : q === "quality"
              ? "Улучшенная варка"
              : "Варка завершена",
        subtitle: saved ? "Стабилизатор удержал рецепт и сохранил результат." : "Награды уже начислены в инвентарь и баланс.",
        heroImage: saved ? GAME_ART.alchemy.amulet : GAME_ART.alchemy.recipe,
        rewards: result?.data?.rewards,
        items: result?.data?.itemsGained,
        tone: "success",
      });
      (result?.data?.itemsGained ?? []).forEach((item) => {
        const label = item.name || item.itemId;
        toast.success(`Получено: ${label} ×${item.count}`, 5000, { icon: item.icon });
      });
    } catch (e: unknown) {
      toast.error(getErrorMessage(e, "Не удалось сварить пилюлю"));
    }
  };

  if (recipesError) {
    return (
      <div className="games-panel text-[var(--destructive)]">
        <p>Не удалось загрузить рецепты алхимии. Проверьте сеть и обновите страницу.</p>
      </div>
    );
  }

  const recipesSkeleton = recipesLoading && !recipesData;
  const hasRecipes = recipes.length > 0;

  return (
    <div className="space-y-4">
      {shopOffers.length > 0 ? (
        <div className="games-panel py-3 px-4">
          <h3 className="games-panel-title flex items-center gap-2 text-base mb-2">
            <ShoppingBag className="w-4 h-4 text-[var(--primary)]" aria-hidden />
            Лавка
          </h3>
          <p className="games-muted text-xs mb-3">
            Те же товары, что у учеников: стабилизаторы, талисманы, свиток знаний для библиотеки.
          </p>
          <div className="flex flex-wrap gap-2">
            {shopOffers.map((offer: { offerId: string; label: string; priceCoins: number }) => (
              <button
                key={offer.offerId}
                type="button"
                disabled={isBuyingShop || coinBalance < offer.priceCoins}
                onClick={() => handleBuyShop(offer.offerId)}
                className="games-btn games-btn-secondary games-btn-sm text-left inline-flex flex-col items-start gap-0.5 max-w-[220px]"
              >
                <span className="text-xs font-medium text-[var(--foreground)]">{offer.label}</span>
                <span className="text-[11px] games-muted inline-flex items-center gap-1">
                  {offer.priceCoins}
                  <Coins className="w-3 h-3 text-amber-500 shrink-0" aria-hidden />
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* Лавка алхимии */}
      {alchemyShopData?.data && (
        <div className="games-panel py-3 px-4">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <h3 className="games-panel-title flex items-center gap-2 text-base">
              <FlaskConical className="w-4 h-4 text-[var(--primary)]" aria-hidden />
              Лавка алхимии
            </h3>
            <div className="flex items-center gap-2">
              <span className="games-muted text-xs">
                Обновлено: {alchemyShopData.data.shopDate}
              </span>
              <button
                type="button"
                onClick={handleRefreshAlchemyShop}
                disabled={!alchemyShopData.data.canRefresh || isRefreshingShop || coinBalance < alchemyShopData.data.refreshCost}
                className="games-btn games-btn-secondary games-btn-sm"
              >
                {isRefreshingShop ? "..." : `Обновить (${alchemyShopData.data.refreshCost} монет)`}
              </button>
            </div>
          </div>
          <p className="games-muted text-xs mb-3">
            Купите материалы для варки. Прямая покупка (x5 цены) доступна для любого товара.
          </p>
          <div className="flex flex-wrap gap-2">
            {alchemyShopData.data.assortment.map((item, index) => (
              <div
                key={`${item.itemId}-${index}`}
                className="games-btn games-btn-secondary games-btn-sm text-left inline-flex flex-col items-start gap-0.5 max-w-[220px]"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-medium text-[var(--foreground)]">
                    {item.name || item.itemId} ×{item.count}
                  </span>
                  {item.purchased && (
                    <span className="text-[10px] bg-green-500/20 text-green-300 px-1.5 py-0.5 rounded">
                      Куплено
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between w-full">
                  <span className="text-[11px] games-muted inline-flex items-center gap-1">
                    {item.priceCoins}
                    <Coins className="w-3 h-3 text-amber-500 shrink-0" aria-hidden />
                  </span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => handleBuyAlchemyItem(index, false)}
                      disabled={item.purchased || isBuyingAlchemyItem || coinBalance < item.priceCoins}
                      className="games-btn games-btn-primary games-btn-xs"
                    >
                      Купить
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBuyAlchemyItem(index, true)}
                      disabled={item.purchased || isBuyingAlchemyItem || coinBalance < item.priceCoins * 5}
                      className="games-btn games-btn-warning games-btn-xs"
                      title="Прямая покупка за 5x цену"
                    >
                      x5
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <GameItemExchangePanel
        title="Обмен предметов"
        subtitle="Соберите расходники по схеме — удобно перед варками и вылазками."
        defaultExpanded
      />

      {/* Блок управления: поиск, фильтры, сортировка */}
      {!recipesSkeleton && hasRecipes && (
        <div className="games-panel py-3 px-4 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[200px] max-w-md">
              <Input
                type="search"
                placeholder="Поиск по названию или описанию..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={Search}
                className="text-sm"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Tooltip content="Фильтр по стихии" position="top" trigger="hover">
                <select
                  value={elementFilter}
                  onChange={(e) => setElementFilter(e.target.value)}
                  className="games-select text-xs"
                >
                  <option value="all">Все стихии</option>
                  <option value="fire">Огонь</option>
                  <option value="water">Вода</option>
                  <option value="earth">Земля</option>
                  <option value="air">Воздух</option>
                  <option value="light">Свет</option>
                  <option value="dark">Тьма</option>
                </select>
              </Tooltip>
              <Tooltip content="Сортировка" position="top" trigger="hover">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "name" | "coinCost" | "mishap" | "element")}
                  className="games-select text-xs"
                >
                  <option value="name">По названию</option>
                  <option value="coinCost">По стоимости монет</option>
                  <option value="mishap">По риску котла</option>
                  <option value="element">По стихии</option>
                </select>
              </Tooltip>
            </div>
          </div>
          <p className="games-muted text-xs">
            Показано: <strong className="text-[var(--primary)]">{filteredRecipes.length}</strong> из {recipes.length} рецептов
          </p>
        </div>
      )}

      {recipesSkeleton ? (
        <div className="games-panel games-muted text-sm py-4 text-center">Загрузка рецептов алхимии…</div>
      ) : null}

      {!recipesSkeleton && !hasRecipes ? (
        <div className="games-panel games-empty">
          <FlaskConical className="games-empty-icon mx-auto block" />
          <p className="games-muted">Пока нет доступных рецептов пилюль.</p>
        </div>
      ) : null}

      {!recipesSkeleton && status ? (
        <div className="games-panel">
          <div className="flex flex-wrap items-start gap-4 mb-3">
            <div className="shrink-0 w-24 sm:w-28 rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--muted)]/20">
              <img
                src={GAME_ART.alchemy.cauldronTier(status.cauldronTier)}
                alt=""
                className="w-full h-24 sm:h-28 object-cover"
              />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="games-muted text-sm">
                  Алхимик: <strong className="text-[var(--foreground)]">ур. {status.alchemyLevel}</strong>{" "}
                  <span className="games-muted text-xs">({status.alchemyExp}/{status.alchemyExpToNext})</span>
                  {status.element ? (
                    <span className="games-muted text-xs"> · стихия: <strong className="text-[var(--foreground)]">{status.element}</strong></span>
                  ) : null}
                </div>
                <div className="games-muted text-sm">
                  Попытки: <strong className="text-[var(--foreground)]">{status.attemptsLeft}</strong> / {status.craftsPerDay}
                </div>
              </div>
              <div className="games-stat-bar w-full h-2 mt-3">
                <div
                  className="games-stat-fill h-full"
                  style={{ width: `${Math.min(100, (status.alchemyExp / (status.alchemyExpToNext || 1)) * 100)}%` }}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
                <div className="games-muted text-sm inline-flex flex-wrap items-center gap-2">
                  Котёл: <strong className="text-[var(--foreground)]">T{status.cauldronTier}</strong>
                  {" · "}Стабилизатор: <strong className="text-[var(--foreground)]">{status.stabilizers?.count ?? 0}</strong>
                  {(status.stabilizers?.count ?? 0) > 0 ? (
                    <img src={GAME_ART.alchemy.amulet} alt="" className="w-5 h-5 rounded object-cover border border-[var(--border)]" />
                  ) : null}
                </div>
                {status.resetAt ? (
                  <div className="games-muted text-xs">
                    Сброс попыток: <strong className="text-[var(--foreground)]">{status.resetAt}</strong>
                  </div>
                ) : null}
                <button
                  type="button"
                  disabled={!status.cauldronUpgrade?.canUpgrade || isUpgrading}
                  className="games-btn games-btn-secondary games-btn-sm"
                  onClick={async () => {
                    try {
                      const res = await upgradeCauldron().unwrap();
                      toast.success(`Котёл улучшен до T${res.data.tier}`);
                    } catch (e: unknown) {
                      toast.error(getErrorMessage(e, "Не удалось улучшить котёл"));
                    }
                  }}
                  title={status.cauldronUpgrade ? `${status.cauldronUpgrade.fragmentItemId}: ${status.cauldronUpgrade.have}/${status.cauldronUpgrade.need}` : undefined}
                >
                  Улучшить котёл ({status.cauldronUpgrade?.have ?? 0}/{status.cauldronUpgrade?.need ?? 0})
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {!recipesSkeleton && hasRecipes && !canCraft ? (
        <div className="games-panel border-[var(--border)] bg-[var(--accent)]">
          <p className="games-muted text-sm">🧪 Сегодня лимит варок исчерпан. Завтра можно снова.</p>
        </div>
      ) : null}
      {!recipesSkeleton && hasRecipes ? (
        <>
          {/* Информация о количестве отфильтрованных рецептов */}
          <div className="games-panel py-2 px-4 mb-3">
            <p className="games-muted text-sm">
              Найдено рецептов: <strong>{filteredRecipes.length}</strong> из {recipes.length}
              {searchQuery && ` по запросу «${searchQuery}»`}
              {elementFilter !== "all" && `, стихия: ${elementFilter}`}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {filteredRecipes.map((r) => {
              const mishap = r.effectiveMishapChancePercent ?? r.mishapChancePercent ?? 0;
              const elementColorMap = {
                fire: "bg-red-500/20 text-red-300 border-red-500/30",
                water: "bg-blue-500/20 text-blue-300 border-blue-500/30",
                earth: "bg-green-500/20 text-green-300 border-green-500/30",
                air: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
                light: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
                dark: "bg-purple-500/20 text-purple-300 border-purple-500/30",
              };
              const elementColor = r.element && typeof r.element === 'string' && r.element in elementColorMap ? elementColorMap[r.element as keyof typeof elementColorMap] : "bg-[var(--muted)]/20 text-[var(--muted-foreground)] border-[var(--border)]";
              return (
                <div key={r._id} className="games-recipe flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-start gap-2">
                      <div className="shrink-0 w-12 h-12 rounded-lg overflow-hidden border border-[var(--border)] bg-[var(--muted)]/20 hidden sm:block">
                        <img src={GAME_ART.alchemy.recipe} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="games-recipe-name">{r.name}</h3>
                        {r.description && <p className="games-muted mt-0.5 text-sm">{r.description}</p>}
                        <div className="flex flex-wrap gap-2 mt-2">
                          {typeof mishap === "number" && (
                            <Tooltip content="Шанс неудачи (мишапа) при варке. Зависит от уровня котла." position="top" trigger="hover">
                              <span className="games-reward-chip">
                                Риск котла: {mishap}%
                              </span>
                            </Tooltip>
                          )}
                          {r.element && (
                            <span className={`games-reward-chip ${elementColor} border`}>
                              Стихия: {r.element}
                            </span>
                          )}
                        </div>
                        <div className="mt-2">
                          <p className="games-muted text-xs mb-1">Ингредиенты:</p>
                          <div className="flex flex-wrap gap-1">
                            {r.ingredients.map((i, idx) => {
                              const enough = i.have >= i.count;
                              return (
                                <Tooltip
                                  key={idx}
                                  content={`${i.name || i.itemId}: требуется ${i.count}, есть ${i.have}`}
                                  position="top"
                                  trigger="hover"
                                >
                                  <span className={`text-xs px-2 py-0.5 rounded-full border ${enough ? "bg-green-500/20 text-green-300 border-green-500/30" : "bg-red-500/20 text-red-300 border-red-500/30"}`}>
                                    {i.name || i.itemId} ×{i.count} ({i.have})
                                  </span>
                                </Tooltip>
                              );
                            })}
                          </div>
                        </div>
                        {r.coinCost > 0 && (
                          <p className="games-muted text-xs mt-2">
                            <Coins className="inline w-3 h-3 mr-1" /> Монет: {r.coinCost}
                          </p>
                        )}
                        {r.resultPreview ? (
                          <div className="flex flex-wrap gap-2 mt-2 text-xs">
                            {r.resultPreview.common?.itemId ? (
                              <span className="games-badge">
                                Обычн.: {r.resultPreview.common.name || r.resultPreview.common.itemId}
                              </span>
                            ) : null}
                            {r.resultPreview.quality?.itemId ? (
                              <span className="games-badge">
                                Улучш.: {r.resultPreview.quality.name || r.resultPreview.quality.itemId}
                              </span>
                            ) : null}
                            {r.resultPreview.legendary?.itemId ? (
                              <span className="games-badge">
                                Легенд.: {r.resultPreview.legendary.name || r.resultPreview.legendary.itemId}
                              </span>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCraft(r._id)}
                    disabled={!r.canCraft || !canCraft || isCrafting}
                    className="games-btn games-btn-primary shrink-0"
                  >
                    {isCrafting ? "..." : "Варить"}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      ) : null}
      <GameResultReveal
        open={reveal.open}
        title={reveal.title}
        subtitle={reveal.subtitle}
        tone={reveal.tone}
        heroImage={reveal.heroImage}
        onClose={() => setReveal(prev => ({ ...prev, open: false }))}
      >
        <div className="flex flex-wrap gap-2">
          {reveal.rewards?.coins ? (
            <span className="games-reward-chip inline-flex items-center gap-1">
              <Coins className="w-3.5 h-3.5" aria-hidden />
              +{reveal.rewards.coins} монет
            </span>
          ) : null}
          {reveal.rewards?.exp ? (
            <span className="games-reward-chip inline-flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" aria-hidden />
              +{reveal.rewards.exp} опыта
            </span>
          ) : null}
          {reveal.items?.map(item => (
            <span key={`${item.itemId}-${item.count}`} className="games-reward-chip inline-flex items-center gap-1">
              {item.icon ? <img src={item.icon} alt="" className="w-4 h-4 rounded object-cover" /> : null}
              {item.name || item.itemId} ×{item.count}
            </span>
          ))}
        </div>
      </GameResultReveal>
    </div>
  );
}
