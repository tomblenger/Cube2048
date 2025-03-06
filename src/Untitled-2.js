function deleteFromArray(arr, index) {
  var halfBefore, halfAfter;
  halfBefore = arr.slice(0, index);
  if ((index + 1) < arr.length) halfAfter = arr.slice(index + 1, arr.length);
  else halfAfter = [];

  return halfBefore.concat(halfAfter);
}



var arr = [23, 43, 14, 9]

arr = deleteFromArray(arr, 4);

arr.sort((a, b) => a - b)
console.log(arr);


function insertArray(arr, item, index) {
  var halfBefore, halfAfter;
  halfBefore = arr.slice(0, index);
  halfBefore.push(item);
  if ((index + 1) < arr.length) halfAfter = arr.slice(index, arr.length);
  else halfAfter = [];

  return halfBefore.concat(halfAfter);
}

console.log(insertArray(arr, 222, 5));

var res;
var arr1 = [1, 3, 5];
var arr2 = [4, 7, 12];
res = [...arr1, ...arr2];
console.log(res);


function deleteIndexesFromArray(arr, indexArr) {
  for (let i = 0; i < indexArr.length; i++) {
    arr = deleteFromArray(arr, indexArr[i] - i);
  }
  return arr;
}

var A = [0, 1, 2, 3, 4, 5, 6];
var B = [0, 1, 4];

console.log(deleteIndexesFromArray(A, B));