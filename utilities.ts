String.prototype.ellipsis = function (length: number) {

    /// this is a array of chars

    if (!this) return this;

    var text = Array.from(this).join('');
    if (text?.length > length) {
        return text.substring(0, length) + "...";
    }
    return text;
}

interface String {
    ellipsis(length: number): string;
    toDate(): Date;
}

interface Number {
    truncateMilliSeconds(): number;
    format(digits: number): string;
    toDate(): Date;
}


interface Date {
    /**
     * <span>{date}</span><span style="margin-inline-start:5px;">{time}</span> 
     */
    toStringFormated(format?: string): string;
    truncateMilliSeconds(): Date;
}
Date.prototype.toStringFormated = function (format?: string) {
    var date = this as Date;
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var day = date.getDate();
    var hour = date.getHours();
    var minute = date.getMinutes();
    var second = date.getSeconds();

    if (format) {
        var d = format = format.replaceAll('dd', day.format(2)).replaceAll('d', day.toString())
        var M = format = format.replaceAll('MM', month.format(2)).replaceAll('M', month.toString())
        var y = format = format.replaceAll('yyyy', year.format(4))

        var h = format = format.replaceAll('hh', (hour > 12 ? hour - 12 : hour).format(2)).replaceAll('h', (hour > 12 ? hour - 12 : hour).toString())
        var H = format = format.replaceAll('HH', hour.format(2)).replaceAll('H', hour.toString())
        var m = format = format.replaceAll('mm', minute.format(2)).replaceAll('m', minute.toString())
        var s = format = format.replaceAll('ss', second.format(2)).replaceAll('s', second.toString())

    }

    return format ? format : `${year.format(4)}/${month.format(2)}/${day.format(2)} ${hour.format(2)}:${minute.format(2)}:${second.format(2)}`;
}

Number.prototype.truncateMilliSeconds = function () {
    var _this = parseInt(this.toFixed());
    return _this - new Date(_this).getMilliseconds();
}
Number.prototype.toDate = function () {
    return new Date(this);
}
String.prototype.toDate = function () {
    return new Date(Array.from(this).join(''));
}
Number.prototype.format = function (digits: number) {
    return this.toLocaleString('en-US', { minimumIntegerDigits: digits, useGrouping: false })
}
Date.prototype.truncateMilliSeconds = function () {
    var _date = this as Date;
    return new Date(_date.getTime().truncateMilliSeconds());
}

function average<T>(arr: T[], field: (value: T) => number) {

    var numbers = arr.filter(k => k || k == 0).map(field) as number[];
    var sum = 0;
    numbers.forEach(k => sum += k);
    return sum / numbers.length;
}

function takeWhile<T>(array: T[], predicate: (value: T) => boolean) {
    var arr: T[] = [];
    var i = 0
    while (array.length > i) {
        if (predicate(array[i]))
            arr.push(array[i])
        else
            break;
        i++;
    }
    return { arr, i };
}


