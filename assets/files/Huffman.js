// Node structure
class Node {
    val = 0;
    freq = 0;
    left; right;

    constructor(val, freq, left, right) {
        this.val = val;
        this.freq = freq;
        this.left = left;
        this.right = right;
    }

    get val() {
        return this.val;
    }

    get freq() {
        return this.freq;
    }

    isLeaf() {
        return this.left == null && this.right == null;
    }
}
Node.prototype.toString = function() {
    return this.val + "(" + this.freq + ")" + "(" + this.left + "," + this.right + ")\n";
}

// Custom heap implementation
class Heap {
    size = 0;
    data = [null];

    insertNode(node) {
        this.data.push(node);
        this.size++;
        this.bubbleUp();
    }

    removeNode() {
        if(this.size == 0) return null;

        var temp = this.data[1];
        this.bubbleDown();
        this.size--;
        this.data.pop();
        return temp;
    }

    get data() {
        return this.data;
    }

    get size() {
        return this.size;
    }

    get isEmpty() {
        return this.size == 0;
    }

    bubbleUp() {
        var currIdx = this.size;
        var parentIdx = Math.floor(currIdx/2);
        // console.log(parentIdx, currIdx, this.size, this.toString(), this.data[parentIdx], this.data[2]);

        while(parentIdx > 0) {
            if(this.data[parentIdx].freq > this.data[currIdx].freq) {
                // Swap with parent
                var temp = this.data[parentIdx];
                this.data[parentIdx] = this.data[currIdx];
                this.data[currIdx] = temp;
                currIdx = parentIdx;
                parentIdx = Math.floor(currIdx/2);
            } else {
                break;
            }
        }
    }

    bubbleDown() {
        var currIdx = 1;
        var toSwapIdx;
        this.data[currIdx] = this.data[this.size];

        while(currIdx <= this.size) {
            var curr = this.data[currIdx];
            var left = this.data[currIdx*2];
            var right = this.data[currIdx*2+1];
            toSwapIdx = -1;

            if(left != null && left.freq < curr.freq) {
                if(right == null || right.freq >= left.freq) toSwapIdx = currIdx*2;
                else if(right.freq < left.freq) toSwapIdx = currIdx*2+1;
            } else if(right != null && right.freq < curr.freq) {
                toSwapIdx = currIdx*2+1;
            }

            // toSwap is not -1
            if(toSwapIdx != -1) {
                var temp = this.data[currIdx];
                this.data[currIdx] = this.data[toSwapIdx];
                this.data[toSwapIdx] = temp;
                currIdx = toSwapIdx;
            } else {
                break;
            }
        }
    }
}
Heap.prototype.toString = function() {
    var result = "";
    for(var node of this.data) {
        if(node != null) result += node.toString();
        result += " ";
    }
    result += "\n";
    return result;
}

// Unit test for heap
function testHeap() {
    var heap = new Heap();
    // Empty
    if(heap.size != 0) console.error("Wrong size for empty heap");
    // One element
    root = new Node('c', 1, null, null);
    heap.insertNode(root);
    if(heap.size != 1) console.error("Wrong size for heap of size 1");
    
    // Randomly generated nodes inserted and popped
    var data = [];
    for(var i = 0; i < 50; i++) {
        data.push(Math.floor(Math.random()*50));
        heap.insertNode(new Node('a', data[i], null, null));
    }
    console.log(data);
    var lastFreq = -1;
    var currNode;
    while(heap.size != 0) {
        currNode = heap.removeNode();
        if(lastFreq != -1 && lastFreq > currNode.freq) console.error("Not increasing order");
        lastFreq = currNode.freq;
        console.log(lastFreq);
    }
    if(heap.size != 0) console.error("Wrong size for empty heap after removing all nodes");
}

function encode(text, debug) {
    var result = "";
    var textL = text.length;

    // Count frequencies of UTF-16 characters
    var frequencies = {};
    var charCode;
    var originalSize = 0;
    for(var i = 0; i < textL; i++) {
        charCode = text.charCodeAt(i);
        if(frequencies[charCode] == null) frequencies[charCode] = 0;
        frequencies[charCode]++;
        originalSize++;
    }
    if(debug) console.log("Frequency:", frequencies);

    // Construct Huffman tree
    var root = buildTree(frequencies);

    // Special case - only 1 character (add it to both children - some redundancy here)
    if(Object.keys(frequencies).length == 1) {
        root = new Node(null, 0, root, root);
    }

    // Generate Huffman code for each character
    var mapping = {};
    getMappingHelper(mapping, root, "");
    if(debug) console.log("Mapping:", mapping);
    
    // Encode Huffman tree as bits
    var huffmanT = [];
    generateTreeHelper(huffmanT, root);
    result += huffmanT.join('');
    if(debug) console.log("Huffman:", result);

    // Encode text
    var encoded = "";
    for(var i = 0; i < textL; i++) encoded += mapping[text.charCodeAt(i)];

    result += encoded;
    if(debug) console.log("Text:", encoded);

    // Calculate compression size
    var compressedSize = Math.ceil(result.length/8);
    originalSize *= 2;
    if(debug) console.log("Compress Ratio: (" + compressedSize + "/" + originalSize + ")" + Math.round(100.0*compressedSize/originalSize) + "%");

    return [result, originalSize, compressedSize];
}

var codeIdx = 0;
function decode(code, debug) {
    var result = [];
    var codeL = code.length;

    // Reconstruct tree
    codeIdx = 0;
    var root = reconstructTreeHelper(code);

    // Follow tree and decode data
    var curr = root;
    for(var i = codeIdx; i < codeL; i++) {
        if(code.charAt(i) === '0') {
            curr = curr.left;
        } else {
            curr = curr.right;
        }

        // Reach a leaf node
        if(curr.isLeaf()) {
            result.push(curr.val);
            curr = root;
        }
    }

    // Support surrogate pairs
    var decodedString = usc2ToUnicode(result);
    if(debug) console.log("USC2 code:", result);
    if(debug) console.log("Result:", decodedString);

    return decodedString;
}

function buildTree(frequencies) {
    var heap = new Heap();

    // Build single nodes
    for(var [c, freq] of Object.entries(frequencies)) heap.insertNode(new Node(c, freq, null, null));

    // Merge nodes into a tree
    while(heap.size > 1) {
        var one = heap.removeNode();
        var another = heap.removeNode();
        var newNode = new Node(0, one.freq + another.freq, one, another);
        heap.insertNode(newNode);
    }

    return heap.removeNode();
}

function getMappingHelper(mapping, root, code) {
    if(root.isLeaf()) mapping[root.val] = code;
    else {
        getMappingHelper(mapping, root.left, code + '0');
        getMappingHelper(mapping, root.right, code + '1');
    }
}

function generateTreeHelper(tree, root) {
    if(root.isLeaf()) {
        tree.push("1");
        tree.push(parseInt(root.val).toString(2).padStart(16, '0'));
    } else {
        tree.push("0");
        generateTreeHelper(tree, root.left);
        generateTreeHelper(tree, root.right);
    }
}

function reconstructTreeHelper(data) {
    if(data.charAt(codeIdx++) === '1') {
        // Leaf node - read next 16-bits and construct node
        return new Node(parseInt(data.substring(codeIdx, codeIdx+=16), 2), 0, null, null);
    } else {
        return new Node(null, 0, reconstructTreeHelper(data), reconstructTreeHelper(data));
    }
}

// Adapted from: https://unicodebook.readthedocs.io/unicode_encodings.html
function usc2ToUnicode(data) {
    var result = "";
    var i;
    for(i = 0; i < data.length-1; i++) {
        var left = data[i];
        var right = data[i+1];
        var code;
        if(0xD800 <= left && left <= 0xDBFF &&
           0xDC00 <= right && right <= 0xDFFF) {
            code = 0x10000;
            code += (left & 0x3FF) << 10;
            code += (right & 0x3FF);
            i++;
        } else {
            code = left;
        }

        // Store code point
        result += String.fromCodePoint(code);
    }

    // Last 16-bits
    if(i === data.length-1) result += String.fromCodePoint(data[i]);

    return result;
}

function testEncodeDecode(text) {
    console.log("Input text:", text);
    var result = encode(text);
    var decoded = decode(result);
    console.log("Is equal?", decoded == text);
}