// function rowToCol(rowArray) {
//     let dims = image.dimsRAS
//     // let colArray = image.img
//     let colArray = new Float32Array(dims[1] * dims[2] * dims[3])
//     console.log(dims)
//     for (var i = 0; i < dims[1]; i++) {
//       for (var j = 0; j < dims[2]; j++) {
//         for (var k = 0; k < dims[3]; k++) {
//           let indexCol = i + j * dims[1] + k * dims[1] * dims[2]
//           let indexRow = i * dims[2] * dims[3] + j * dims[3] + k
//           colArray[indexCol] = rowArray[indexRow]
//         }
//       }
//     }
//     return colArray;
//   }

fn main() {
    let arr: &[f32] = &[1.0, 2.0, 3.0, 4.0, 5.0];
    let dims: [usize; 4] = [1, 1, 1, 1];
    println!("Your new array {}", row_to_col(arr, dims));
}

fn row_to_col(row_array: &[f32], dims: [usize; 4]) -> Vec<f32> {
    let col_array_len = dims[1] * dims[2] * dims[3];
    let mut col_array = vec![0.0; col_array_len];
    for i in 0..dims[1] {
        for j in 0..dims[2] {
            for k in 0..dims[3] {
                let index_col = i + j * dims[1] + k * dims[1] * dims[2];
                let index_row = i * dims[2] * dims[3] + j * dims[3] + k;
                col_array[index_col] = row_array[index_row];
            }
        }
    }
    col_array
}