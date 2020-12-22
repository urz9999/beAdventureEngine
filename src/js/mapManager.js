class MapManager {

    map;

    constructor() {
        this.map = {};
    }

    async loadMap(name) {
        // Load data
        const response = await fetch(`assets/maps/${name}.json`)
        this.map = await response.json();
        return this.map;
    }
}
