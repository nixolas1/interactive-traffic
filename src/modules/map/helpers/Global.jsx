// global variables shared between files. Some are initialized here, so that they never are undefined, others are initialized elsewhere

let _global = {
    atoms: {},
    activeAtoms: [],
    index: 0,
    mouse: {x: 0, y: 0},
    options: {},
    debug: {
        active: 0,
    }
}
export default _global;
