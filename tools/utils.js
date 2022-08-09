export const sleep = (second) => {
    return new Promise ((resolve, reject) => {setTimeout(resolve, second * 10 ** 3)})
}

export function addHours(numOfHours, date = new Date()) {
    date.setTime(date.getTime() + numOfHours * 60 * 60 * 1000);
    return date;
  }

export function round(num, decimal) {
    var rounded = Math.round((num + Number.EPSILON) * 10 ** decimal) / (10 ** decimal);
    return rounded
}