// /utils/keywords-map.ts

export const synonyms: Record<string, string[]> = {
  pat: ["pat", "paturi", "pat matrimonial", "pat dublu", "pat single"],
  canapea: ["canapea", "canapele", "sofa", "coltar canapea", "canapea extensibila"],
  masa: ["masă", "mese", "masa dining", "masa cafea", "masa de bucatarie"],
  scaun: ["scaun", "scaune", "fotoliu", "taburet"],
  dulap: ["dulap", "dulapuri", "sifonier", "garderoba"],
  covor: ["covor", "covoare", "mocheta", "carpeta"],
  tablou: ["tablou", "tablouri", "tablou canvas", "pictura", "tablou decorativ"],
  lampa: ["lampă", "lampi", "lampadar", "aplica perete", "lustra", "veioza"],
  perdea: ["perdea", "perdele", "draperie", "draperii", "jaluzele"],
  planta: ["planta", "plante", "ghiveci", "floare decorativa"],
  oglinda: ["oglindă", "oglizi", "oglinda baie", "oglinda dormitor"],
};

export const whitelist: Record<string, string[]> = {
  tablou: ["canvas", "pictura", "decor", "perete", "art", "led"],
  lampa: ["lumina", "lustra", "perete", "birou", "camera", "decor"],
  perdea: ["geam", "camera", "fereastra", "decor"],
  pat: ["dormitor", "matrimonial", "single", "lenjerie"],
};

export const blacklist: Record<string, string[]> = {
  tablou: ["siguranta", "electric", "automat", "distributie", "prize"],
  pat: ["patrat", "patrata"],
  lampa: ["statie", "auto", "lanterna"], // evită confuziile cu lămpi tehnice
};
