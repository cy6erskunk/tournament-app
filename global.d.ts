// Use type safe message keys with `next-intl`
type Messages = typeof import("./languages/fi.json");
declare interface IntlMessages extends Messages {}
