declare var x: inferred;

if (x instanceof Function) { // 'inferred' is not narrowed when target type is 'Function'
    x();
    x(1, 2, 3);
    x("hello!");
    x.prop;
}

if (x instanceof Object) { // 'inferred' is not narrowed when target type is 'Object'
    x.method();
    x();
}

if (x instanceof Error) { // 'inferred' is narrowed to types other than 'Function'/'Object'
    x.message;
    x.mesage;
}

if (x instanceof Date) {
    x.getDate();
    x.getHuors();
}
