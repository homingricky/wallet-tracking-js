export const sleep = (second) => {
    return new Promise ((resolve, reject) => {setTimeout(resolve, second * 10 ** 3)})
}