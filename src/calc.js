function deleteFromArray(arr, index) {
    let halfBefore, halfAfter;
    halfBefore = arr.slice(0, index);
    if ((index + 1) < arr.length) halfAfter = arr.slice(index + 1, arr.length);
    else halfAfter = [];
    let buf = arr[index].tail.length;
    if (buf !== 0) {
        for (let i = 0; i < buf; i++) {
            // arr[index].tail[i].type = FOOD;
            // food.push(arr[index].tail[i]);
        }
    }
    return halfBefore.concat(halfAfter);
}

function deleteIndexesFromArray(arr, indexArr) {
    for (let i = 0; i < indexArr.length; i++) {
        arr = deleteFromArray(arr, indexArr[i] - i);
    }
    return arr;
}

var defaultArr = [123, 234, 122, 943, 23, 323, 12];
var arr = [1, 4, 5];

console.log(deleteIndexesFromArray(defaultArr, arr));