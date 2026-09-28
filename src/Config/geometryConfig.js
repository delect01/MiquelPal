// Configuració geomètrica central de l'aplicació

export const PALLET_CONFIG = {
  id: "default-pallet",

  name: "Palet predeterminat",

  /*
    Dimensions expressades en WORLD pallet.

    sizeX = dimensió sobre X pallet
    sizeY = dimensió sobre Y pallet
    sizeZ = alçada
  */
  sizeX: 800,
  sizeY: 1200,
  sizeZ: 20,

  color: "#8b5a2b",

  modelType: "BOX",
  modelData: null
};


export const PIECE_CONFIG = {
  width: 200,
  height: 100,
  depth: 60,
  topWidth: 200,
  topDepth: 60
};

export const COLLISION_CONFIG = {
  tolerance: 0.1
};

export const REFERENCE_POINTS = {
  CENTER: "CENTER",

  TOP_CENTER: "TOP_CENTER",
  BOTTOM_CENTER: "BOTTOM_CENTER",

  FRONT_CENTER: "FRONT_CENTER",
  BACK_CENTER: "BACK_CENTER",

  LEFT_CENTER: "LEFT_CENTER",
  RIGHT_CENTER: "RIGHT_CENTER"
};