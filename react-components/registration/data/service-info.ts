/** Illustrative photos from Wikimedia Commons, stored under /img/registration/services/. */

export type ServicePhoto = { src: string; alt: string };

export type ServiceInfo = {
  title: string;
  lead: string;
  points: string[];
  photos: ServicePhoto[];
};

const photo = (name: string, alt: string): ServicePhoto => ({
  src: `/img/registration/services/${name}`,
  alt,
});

export const SERVICE_INFO: Record<string, ServiceInfo> = {
  intercity_taxi: {
    title: "تاکسی بین‌شهری",
    lead: "سواری بین‌شهری با راننده تأییدشده، مناسب مأموریت‌ها و سفرهای برنامه‌ریزی‌شده.",
    points: [
      "مبدأ و مقصد را خودتان مشخص می‌کنید.",
      "یک خودرو و یک راننده در کل مسیر.",
      "زمان حرکت با شما هماهنگ می‌شود.",
    ],
    photos: [
      photo("intercity-1.jpg", "تاکسی زرد در یک خیابان آفتابی"),
      photo("intercity-2.jpg", "تاکسی در حال حرکت در خیابان"),
    ],
  },
  airport_transfer: {
    title: "ترانسفر فرودگاهی",
    lead: "ترانسفر ویژه فرودگاهی، از مقصد تا درب ترمینال.",
    points: [
      "هماهنگ با ساعت پرواز.",
      "تحویل یا سوار شدن کنار ترمینال.",
      "مناسب مسافر، مهمان یا همکار مجموعه.",
    ],
    photos: [
      photo("airport-1.jpg", "ایستگاه تاکسی مقابل فرودگاه"),
      photo("airport-2.jpg", "تاکسی در محوطه فرودگاه"),
    ],
  },
  business_plus_city: {
    title: "بیزینس پلاس درون‌شهری",
    lead: "سرویس تشریفاتی و لوکس درون‌شهری با خودروهای لاکچری.",
    points: [
      "برای مهمان، مدیر یا مراسم داخل شهر.",
      "خودرو راحت‌تر از سرویس معمولی.",
      "جزئیات با تیم مسترشوفر هماهنگ می‌شود.",
    ],
    photos: [
      photo("vip-1.jpg", "خودروی تشریفاتی مشکی"),
      photo("vip-2.jpg", "نمای دیگر خودرو ویژه"),
    ],
  },
  intercity_express: {
    title: "حمل‌ونقل بار سریع",
    lead: "جابه‌جایی سریع نامه، اسناد، بارهای کوچک یا حساس با خودرو سواری.",
    points: [
      "مناسب مدارک و بارهای کوچک.",
      "مسیر بین‌شهری با خودرو سواری.",
      "زمان ارسال با شما هماهنگ می‌شود.",
    ],
    photos: [
      photo("private-1.jpg", "سواری برای جابه‌جایی سریع"),
      photo("private-2.jpg", "نمای جانبی خودرو سواری"),
    ],
  },
  ceremonial_van: {
    title: "ون تشریفات سازمانی",
    lead: "سرویس حمل‌ونقل با ون ویژه سازمان‌ها.",
    points: [
      "برای کارکنان، مهمانان یا برنامهٔ سازمانی.",
      "ظرفیت بیشتر از سواری.",
      "زمان حرکت با مجموعه هماهنگ می‌شود.",
    ],
    photos: [
      photo("shared-1.jpg", "ون مسافربری"),
      photo("shared-2.jpg", "ون چندنفره"),
    ],
  },
  charter_van: {
    title: "ون",
    lead: "حمل‌ونقل مسافران با ون دربستی.",
    points: [
      "ون فقط برای همان مسافران.",
      "مناسب گروه و مسیر اختصاصی.",
      "زمان حرکت با شما هماهنگ می‌شود.",
    ],
    photos: [
      photo("shared-1.jpg", "ون مسافربری"),
      photo("shared-2.jpg", "ون چندنفره"),
    ],
  },
  not_sure: {
    title: "هنوز مطمئن نیستم",
    lead: "در آینده برای انتخاب سرویس مناسب تصمیم‌گیری می‌کنم.",
    points: [
      "لازم نیست همین حالا یک خدمت را قطعی کنید.",
      "بعد از ثبت‌نام می‌توانید انتخاب را دقیق‌تر کنید.",
      "تیم مسترشوفر برای انتخاب راهنمایی می‌کند.",
    ],
    photos: [
      photo("unsure-1.jpg", "تاکسی شهری"),
      photo("unsure-2.jpg", "اتوبوس مسافربری"),
    ],
  },
};
