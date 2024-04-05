<?php
include "ketnoi.php";
include "SanPham.php";
$query = "SELECT * FROM SanPham";
$DSSanPham = array();
$data = mysqli_query($ketnoi, $query);
while($row = mysqli_fetch_assoc($data)) {
array_push($DSSanPham, new SanPham(
$row["MaSP"], $row["TenSP"], $row["MoTa"], $row["DonGia"]
));
}
echo json_encode($DSSanPham); //Chuyển đổi array sang json array
mysqli_close($ketnoi); //Đóng kết nối
?>