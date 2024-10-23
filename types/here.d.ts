declare namespace H {
    export namespace service {
      class Platform {
        constructor(options: { apikey: string });
        createDefaultLayers(): any;
      }
    }
    export namespace map {
      class Map {
        constructor(element: HTMLElement, defaultLayers: any, options: { zoom: number; center: { lat: number; lng: number } });
        addObject(object: any): void;
        getViewModel(): { setLookAtData(options: { bounds: any }): void };
        dispose(): void;
      }
  
      class Polyline {
        constructor(geometry: any, options: { style: { strokeColor: string; lineWidth: number } });
        getBoundingBox(): any;
      }
    }
  
    export namespace geo {
      class LineString {
        pushLatLngAlt(lat: number, lng: number): void;
      }
    }
  
    export namespace mapevents {
      class Behavior {
        constructor(mapEvents: any);
      }
      class MapEvents {
        constructor(map: any);
      }
    }
  
    export namespace ui {
      class UI {
        static createDefault(map: any, layers: any): void;
      }
    }
  }
  