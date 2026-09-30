/**
 * Hüquqi mənbə sənədindən yaradılmış ilk on bələdçinin tag-ları
 * (`build-knowledge-hub-sql.ts`, slug-lar production-dakı ilə eynidir).
 * Miqrasiya tag-ı yalnız boş olanda yazır — redaktorun seçiminə toxunmur.
 */
export const EXISTING_ARTICLE_TAGS: Record<string, string[]> = {
  "menzil-ve-diger-dasinmaz-emlakin-alqi-satqisi": ["alqı-satqı", "müqavilə", "notarius", "çıxarış", "beh"],
  "kiraye-munasibetleri": ["kirayə", "müqavilə", "depozit"],
  "miras-ve-mulkiyyetin-oturulmesi": ["vərəsəlik", "miras", "paylı mülkiyyət"],
  "ipoteka-ve-kreditlesme": ["ipoteka", "kredit", "İKZF"],
  "notariat-elektron-xidmetler-ve-dovlet-qeydiyyati": ["notarius", "dövlət qeydiyyatı", "çıxarış"],
  "vergiler-dovlet-rusumlari-ve-emeliyyat-xercleri": ["vergi", "dövlət rüsumu", "xərclər"],
  "tikinti-ve-yeni-tikililer": ["yeni tikili", "MTK", "tikinti icazəsi"],
  "torpaq-munasibetleri": ["torpaq", "təyinat"],
  "mehkeme-praktikasindan-numuneler-ve-tez-tez-rastlanan-mubahiseler": ["məhkəmə", "mübahisə", "risklər"],
  "emlak-agentinin-huquqi-statusu-komissiya-ve-mesuliyyet": ["agentlik", "komissiya", "broker"],
};
