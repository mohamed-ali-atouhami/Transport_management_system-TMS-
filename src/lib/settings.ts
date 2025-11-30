export const ITEMS_PER_PAGE = 5;

type RouteAccessMap = {
  [key: string]: string[];
};

export const routeAccessMap: RouteAccessMap = {
  "/admin(.*)": ["admin"],
  "/driver(.*)": ["driver"],
  "/client(.*)": ["client"],
  "/list/users": ["admin"],
  "/list/drivers": ["admin"],
  "/list/clients": ["admin"],
  "/list/vehicles": ["admin"],
  "/list/trips": ["admin", "driver", "client"],
  "/list/shipments": ["admin", "client", "driver"], // Clients can view their shipments, drivers can view shipments on their trips
  "/list/issues": ["admin"],
  "/list/expenses": ["admin", "driver"],
  "/list/notifications": ["admin"],
  "/list/maintenance": ["admin"],
};