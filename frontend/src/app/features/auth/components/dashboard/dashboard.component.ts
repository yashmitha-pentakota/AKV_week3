import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import * as XLSX from 'xlsx';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { jsPDF } from 'jspdf';
import * as bootstrap from 'bootstrap';
import { Observable } from 'rxjs';
import { Router}  from '@angular/router';
import { ChatService } from 'src/app/core/services/chat.service';



@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  username: string = ''; // Directly stores the username
  email: string = ''; // Directly stores the email
  thumbnail: string = ''; // Default profile picture
  dropdownOpen: boolean = false; // Flag to control dropdown visibility
  isModalOpen: boolean = false; // Flag to control modal visibility
  selectedFile: File | null = null; // Stores the selected file for upload
  isUploading: boolean = false; // Indicates if file is being uploaded
  vendorCount: number = 0;
  products: any[] = [];
  vendors: any[] = [];
  categories: any[] = [];
  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalItems: number = 0;
  totalPages: number = 0;
  paginatedProducts: any[] = [];

  isProductModalOpen: boolean = false;
  addProductForm: FormGroup;
  selectedProducts: any[] = [];
  allSelected: boolean = false; // Flag to track if all rows are selected
  selectedProductId: number | null = null;
  
  searchTerm: string = '';
  selectedColumns: string[] = []; // No columns selected by default
  filterColumns: string[] = [
    'Product Name',
    'Status',
    'Category',
    'Vendors',
    'Quantity',
    'Unit',
  ];


  //search
  showFilters: boolean = false;
  columns = [
    { label: 'Product Name', key: 'product_name', checked: false },
    { label: 'Status', key: 'status', checked: false },
    { label: 'Category', key: 'category', checked: false },
    { label: 'Vendors', key: 'vendors', checked: false },
    { label: 'Quantity', key: 'quantity', checked: false },
    { label: 'Unit', key: 'unit', checked: false },
  ];


selectedCategory: string = '';
selectedVendor: string = '';
selectedStatus: string = '';


isDragging: boolean = false;
isModalOpenprofile=false;


  quantityChanges: { [key: number]: number } = {};
  flag = 1;
  selectedProductForEdit: any;
  editSelectedFile: File | null = null;
  fileData: any[] = [];
  showCart: boolean = false;
  currentCartPage: number = 1;
  totalCartPages: number = 1;
  cartPageSize: number = 5; // Items per page
  totalCartItems: number = 0;
  cartPages: number[] = [];
  cartProducts: any[] = [];
  filterData: any = {
    product_name: '',
    category_name: '',
    vendors: ''
  };
  //files import
  file: File | null = null;

  constructor(private http: HttpClient, private fb: FormBuilder , private router: Router ) {  //,private chatService: ChatService
    this.addProductForm = this.fb.group({
      productName: ['', Validators.required],
      category: ['', Validators.required],
      vendor: ['', Validators.required],
      quantity: ['', [Validators.required, Validators.min(1)]],
      unitPrice: ['', [Validators.required, Validators.min(0)]],
      unit: ['', Validators.required],
      status: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    // Get the logged-in user's details after verifying the token
    this.fetchUserDetails();
    this.getVendorsCount();
    this.getProducts();

    this.getCategories();
    this.getVendors();
    this.fetchCartPage(this.currentCartPage);
  }

  //chat 

  // Function to toggle chat visibility
  navigateToChat(): void {
    this.router.navigate(['/chat']) // Navigate to the chat component
  }
  // Handle file selection
  onFileSelect(event: any): void {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      this.file = selectedFile;
    }
  }
  // Handle file upload
  uploadExcelFile(): void {
    if (!this.file) {
      alert("Please select a file first.");
      return;
    }

    const formData = new FormData();
    formData.append('file', this.file);

    this.http.post('/api/cart/import', formData).subscribe(
      (response) => {
        console.log('Upload successful!', response);
      },
      (error) => {
        console.error('Error uploading file!', error);
      }
    );
  }
  toggleTable(view: string): void {
    if (view === 'cart') {
      this.showCart = true;
    } else {
      this.showCart = false;
      this.flag = 1;
    }
  }

  fetchCartPage(page: number): void {
    if (page < 1 || (this.totalCartPages && page > this.totalCartPages)) return;

    this.http
      .get<{
        success: string;
        products: product[];
        total: number;
        page: number;
        limit: number;
      }>(
        `${environment.apiUrl}/auth/cart?page=${page}&limit=${this.cartPageSize}`
      )
      .subscribe({
        next: (data) => {
          console.log(data);
          this.cartProducts = data.products;
          this.totalCartItems = data.total;
          this.currentCartPage = data.page;
          this.totalCartPages = Math.ceil(
            this.totalCartItems / this.cartPageSize
          );
          this.cartPages = Array.from(
            { length: this.totalCartPages },
            (_, i) => i + 1
          );
          console.log(this.cartPages);
          console.log('cartProducts: ', this.cartProducts);
        },
        error: (error) => {
          console.error('Error fetching cartProducts:', error);
        },
      });
  }

  deleteCartItem(cartId: number): void {
    this.http
      .delete<any>(`${environment.apiUrl}/auth/delete-cart-item/${cartId}`)
      .subscribe({
        next: () => {
          this.fetchCartPage(this.currentCartPage);
        },
        error: (err) => {
          console.error('Error deleting cart item:', err);
        },
      });
  }

  updateQuantity(product: any, change: number): void {
    const newQuantity = product.quantity + change;
    if (newQuantity >= 0) {
      product.quantity = newQuantity;
      const initialQuantity = product.initialQuantity || product.quantity;
      this.quantityChanges[product.product_id] = newQuantity - initialQuantity;
    }
  }

  moveSelectedProducts(): void {
    const selectedProducts = this.selectedProducts
      .filter((product) => product.isSelected)
      .map((product) => {
        console.log('Product object:', product); // Log to check the structure of the product
        return {
          productId: product.product_id, // Ensure product_id exists
          vendorId: product.selectedVendorId,
          quantity: product.quantity_in_stock,
        };
      });

    if (selectedProducts.length === 0) {
      alert('Please select at least one product to move.');
      return;
    }
    console.log('Selected products in frontend:', selectedProducts);
    this.http
      .post(`${environment.apiUrl}/auth/move-to-cart`, {
        products: selectedProducts,
      })
      .subscribe({
        next: (response) => {
          // alert('Products moved successfully!');
          this.http
            .post(`${environment.apiUrl}/auth/cart/update`, {
              products: selectedProducts,
            })
            .subscribe({
              next: (response) => {
                alert(
                  'Products moved successfully! And cart updated successfully!'
                );
              },
              error: (error) => {
                alert('Failed to update cart.');
                console.error('Error update cart:', error);
              },
            });
        },
        error: (error) => {
          alert('Failed to move products.');
          console.error('Error moving products to cart:', error);
        },
      });
  }
  uploadData() {}

  adjustQuantity(product: any, change: number): void {
    const newQuantity = product.quantity_in_stock + change;
    if (newQuantity >= 0 && newQuantity <= product.quantity_in_stock) {
      product.quantity_in_stock = newQuantity;
    }
  }

  clearSelectedProducts() {
    this.selectedProducts = [];
  }

  toggleFilters() {
    if (this.isModalOpen) return;// Prevent filter from opening when modal is active
    this.showFilters = !this.showFilters;
  }
  

// In onSearch:

onSearch(event: Event) {
  const searchTerm = (event.target as HTMLInputElement).value.toLowerCase();
  this.searchTerm = searchTerm;
  console.log('Search term:', searchTerm);

  // Call `getProducts` with the current search term and selected columns
  const selectedColumnsKeys = this.columns
    .filter((col) => col.checked)
    .map((col) => col.key);
}

// Apply search and filter products
applySearch() {
  if (this.searchTerm) {
    this.paginatedProducts = this.products.filter((product) =>
      product.product_name.toLowerCase().includes(this.searchTerm)
    );
  } else {
    this.paginatedProducts = [...this.products]; // Reset to original products if search term is empty
  }
}



searchQuery(event: any) {
  this.searchTerm = event.target.value.toLowerCase();
  this.loadProducts();
}

// Toggle selected columns
onColumnToggle(column: any) {
column.checked = !column.checked;
this.applyFilters();
}

// Apply Filters
applyFilters(): void {
  this.loadProducts();
}


// Load Products with dynamic filtering based on selected columns
loadProducts(): void {
  const params = new HttpParams()
    .set('page', this.currentPage.toString())
    .set('limit', this.itemsPerPage.toString());

  this.http
    .get<{ products: any[]; totalItems: number }>(
      `${environment.apiUrl}/auth/products`,
      { params }
    )
    .subscribe({
      next: (response) => {
        let filteredProducts = response.products;
        console.log('****', filteredProducts);

        // Ensure 'vendors' is always an array of strings
        filteredProducts = filteredProducts.map((product) => {
          if (typeof product.vendors === 'string') {
            product.vendors = [product.vendors]; // Convert single string to array
          }
          return product;
        });

        this.totalPages = Math.ceil(response.totalItems / this.itemsPerPage);

        // Apply selected category filter first
        if (this.selectedCategory) {
          filteredProducts = filteredProducts.filter(
            (product) => product.category_name === this.selectedCategory
          );
        }

        // Apply search filtering based on checked columns
        if (this.searchTerm) {
          filteredProducts = filteredProducts.filter((product) => {
            return this.columns.some(column => 
              column.checked && this.filterByColumn(product, column.key)
            );
          });
        }

        // Apply selected vendor filter
        if (this.selectedVendor) {
          filteredProducts = filteredProducts.filter(
            (product) => product.vendors.includes(this.selectedVendor)
          );
        }

        // Apply selected status filter
        if (this.selectedStatus !== '') {
          filteredProducts = filteredProducts.filter(
            (product) => product.status === this.selectedStatus
          );
        }

        // Update the products list
        this.products = filteredProducts;
      },
      error: (error) => {
        console.error('Error fetching products:', error);
      },
    });
}

// Filter based on the selected column
filterByColumn(product: any, key: string): boolean {
  const searchTermLower = this.searchTerm.toLowerCase();

  if (key === 'vendors') {
    // Check vendors array against search term
    return product.vendors && product.vendors.some((vendor: string) => vendor.toLowerCase().includes(searchTermLower));
  } else if (key === 'category') {
    // Check category against search term; ensure it's looking in the correct property
    return product.category_name && product.category_name.toLowerCase().includes(searchTermLower);
  }

  // Default case for other fields
  return product[key] && product[key].toString().toLowerCase().includes(searchTermLower);
}

// Get filtered products with search term and selected columns
getFilteredProducts(searchTerm: string, columns: string): void {
  const params = {
    page: '1', // Adjust page dynamically based on user interaction
    limit: '10', // Adjust this as needed
    searchTerm: searchTerm,
    columns: columns || '*', // If no columns selected, send '*' for all
  };

  console.log('Search Term:', this.searchTerm);
  console.log('Selected Columns:', this.selectedColumns);

  this.http
    .get<{ products: any[]; totalItems: number }>(
      `${environment.apiUrl}/auth/products`,
      { params }
    )
    .subscribe(
      (response) => {
        // Handle the response, e.g., set products to the component's products array
        console.log('Filtered products:', response.products);
      },
      (error) => {
        console.error('Error applying filters:', error);
      }
    );
}

//searchhhhhhhhhhhhhh

  // Get filtered products with search term and selected columns
  // getFilteredProducts(searchTerm: string, columns: string): void {
  //   const params = new HttpParams()
  //     .set('page', '1') // Adjust page dynamically based on user interaction
  //     .set('limit', '10') // Adjust this as needed
  //     .set('searchTerm', searchTerm)
  //     .set('columns', columns || '*'); // If no columns selected, send '*' for all

  //   console.log('Search Term:', this.searchTerm);
  //   console.log('Selected Columns:', this.selectedColumns);

  //   this.http.get<{ products: any[]; totalItems: number }>(`${environment.apiUrl}/auth/products`, { params })
  //     .subscribe(
  //       response => {
  //         console.log('Filtered products:', response.products);
  //       },
  //       error => {
  //         console.error('Error applying filters:', error);
  //       }
  //     );
  // }
 
  getProducts() {
    const params = new HttpParams()
      .set('page', this.currentPage.toString())
      .set('limit', this.itemsPerPage.toString());

    this.http
      .get<{ products: any[]; totalItems: number }>(
        `${environment.apiUrl}/auth/products`,
        { params }
      )
      .subscribe(
        (response) => {
          console.log('products -', response);
          this.products = response.products;
          this.totalItems = response.totalItems;
          this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
          this.paginatedProducts = this.products;
        },
        (error) => {
          console.error('Error fetching products:', error);
        }
      );
  }

  showDeleteModal(product: any) {
    this.selectedProductId = product.product_id; // Store the product ID to delete
    const modal = new bootstrap.Modal(
      document.getElementById('deleteConfirmationModal')!
    );
    modal.show();
  }

  // Confirm the deletion of the product
  confirmDelete() {
    if (this.selectedProductId) {
      this.http
        .delete(`${environment.apiUrl}/auth/products/${this.selectedProductId}`)
        .subscribe(
          (response: any) => {
            alert(response.message); // Success message from the backend
            // Update the UI to reflect the deletion
            this.getProducts();
          },
          (error) => {
            alert('Failed to delete the product');
            console.error(error);
          }
        );
    }

    // Close the modal after the operation
    const modal = bootstrap.Modal.getInstance(
      document.getElementById('deleteConfirmationModal')!
    );
    modal?.hide();
  }

  downloadProduct(product: any) {
    const doc = new jsPDF();

    const { product_id, product_name, unit_price, unit ,vendor_name } =
      product;

    // Add product details to the PDF
    doc.text('Product Details', 20, 20);
    doc.text(`Product ID: ${product_id}`, 20, 30);
    doc.text(`Product Name: ${product_name}`, 20, 40);
    doc.text(`Price: ${unit_price}`, 20, 50);
    doc.text(`Units: ${unit}`, 20, 60);
    doc.text(`Vendor: ${vendor_name}`, 20, 70);
    // Save the PDF
    doc.save(`${product_name}_${product_id}.pdf`);
  }

  editProduct(product: any) {
    product.isEditing = true;
    product.originalData = { ...product }; // Store original data in case of cancel
  }

  saveProduct(product: any) {
    const updatedProductData = {
      product_id: product.product_id,
      product_name: product.product_name,
      category_id: product.category_id,
      quantity_in_stock: product.quantity_in_stock,
      unit_price: product.unit_price,
      product_image: product.product_image,
      status: product.product_status,
      unit: product.unit,
      vendor_id: product.vendor_id, // Include vendor ID
    };

    console.log('Updated product data:', updatedProductData);
    this.http
      .put(
        `${environment.apiUrl}/auth/products/${product.product_id}`,
        updatedProductData
      )
      .subscribe(
        (response: any) => {
          console.log('Product updated successfully:', response);
          product.isEditing = false;

          if (product.selectedFile) {
            const formData = new FormData();
            formData.append('product_image', product.selectedFile);
            formData.append('productId', product.product_id); // Include product ID in the form data

            const token = localStorage.getItem('token');
            const headers = new HttpHeaders({
              Authorization: `Bearer ${token}`,
            });

            this.isUploading = true;

            this.http
              .post(
                `${environment.apiUrl}/auth/upload-product-image`,
                formData,
                { headers }
              )
              .subscribe(
                (uploadResponse: any) => {
                  console.log('File uploaded successfully:', uploadResponse);
                  product.product_image = uploadResponse.url; // Update the product image URL
                  this.isUploading = false;
                },
                (error) => {
                  console.error('Error uploading file:', error);
                  this.isUploading = false;
                }
              );
          }
        },
        (error) => {
          console.error('Error updating product:', error);
        }
      );
  }

  onFileSelectPro(event: any, product: any) {
    const file = event.target.files[0];
    if (file) {
      product.selectedFile = file; // Store the selected file in the product object
      console.log('Selected file:', file);
    }
  }

  cancelEdit(product: any) {
    Object.assign(product, product.originalData); // Restore original data
    product.isEditing = false;
  }
  getCategories() {
    this.http
      .get<{ categories: any[] }>(`${environment.apiUrl}/auth/categories`)
      .subscribe(
        (response) => {
          this.categories = response.categories;
        },
        (error) => {
          console.error('Error fetching categories:', error);
        }
      );
  }

  getVendors() {
    this.http
      .get<{ vendors: any[] }>(`${environment.apiUrl}/auth/vendors`)
      .subscribe(
        (response) => {
          this.vendors = response.vendors;
        },
        (error) => {
          console.error('Error fetching vendors:', error);
        }
      );
  }

  onCheckboxChange(event: any, product: any): void {
    if (event.target.checked) {
      this.selectedProducts.push(product);
    } else {
      const index = this.selectedProducts.findIndex(
        (p) => p.product_id === product.product_id
      );
      if (index !== -1) {
        this.selectedProducts.splice(index, 1);
      }
    }
  }

  onHeaderCheckboxChange(event: any): void {
    this.allSelected = event.target.checked;
    this.products.forEach((product) => {
      product.selected = this.allSelected;
      if (this.allSelected) {
        if (!this.selectedProducts.includes(product)) {
          this.selectedProducts.push(product);
        }
      } else {
        this.selectedProducts = [];
      }
    });
  }

  downloadExcel(): void {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(
      this.selectedProducts
    );
    const workbook: XLSX.WorkBook = {
      Sheets: { Products: worksheet },
      SheetNames: ['Products'],
    };

    XLSX.writeFile(workbook, 'yashmitha.xlsx');
  }

  openProductModal() {
    this.isProductModalOpen = true;
  }

  closeProductModal() {
    this.isProductModalOpen = false;
  }
  addProduct() {
    if (this.addProductForm.valid) {
      const productData = this.addProductForm.value;

      this.http
        .post(`${environment.apiUrl}/auth/products`, productData)
        .subscribe(
          (response: any) => {
            console.log('Product added successfully:', response);
            const newProduct = response.product;
            this.products.push(newProduct); // Update the products array with the new product

            if (this.selectedFile) {
              const formData = new FormData();
              formData.append('product_image', this.selectedFile);
              formData.append('productId', newProduct.product_id); // Include product ID in the form data

              const token = localStorage.getItem('token');
              const headers = new HttpHeaders({
                Authorization: `Bearer ${token}`,
              });

              this.isUploading = true;

              this.http
                .post(
                  `${environment.apiUrl}/auth/upload-product-image`,
                  formData,
                  { headers }
                )
                .subscribe(
                  (uploadResponse: any) => {
                    console.log('File uploaded successfully:', uploadResponse);
                    newProduct.product_image = uploadResponse.url; // Update the product image URL
                    this.isUploading = false;
                    this.closeProductModal();
                    alert('Product added successfully!');
                  },
                  (error) => {
                    console.error('Error uploading file:', error);
                    this.isUploading = false;
                  }
                );
            } else {
              this.closeProductModal();
              alert('Product added successfully!');
            }
          },

          (error) => {
            console.error('Error adding product:', error);
          }
        );
    } else {
      console.error('Form is invalid');
    }
  }

  saveProductData(productData: any) {
    this.http
      .post(`${environment.apiUrl}/auth/products`, productData)
      .subscribe(
        (response: any) => {
          console.log('Product added successfully:', response);
          this.products.push(response.product); // Update the products array with the new product
          this.closeProductModal();
        },
        (error) => {
          console.error('Error adding product:', error);
        }
      );
  }

  getVendorsCount() {
    this.http
      .get<{ count: number }>(`${environment.apiUrl}/auth/vendors/count`)
      .subscribe(
        (response) => {
          this.vendorCount = response.count; // Update vendor count
        },
        (error) => {
          console.error('Error fetching vendor count:', error);
        }
      );
  }
  //all products
  // getProducts() {
  //   this.http.get<any[]>(`${environment.apiUrl}/auth/products`).subscribe(
  //     (products) => {
  //       this.products = products; // Update products array
  //     },
  //     (error) => {
  //       console.error('Error fetching products:', error);
  //     }
  //   );
  // }

  // Navigate to the previous page
  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.getProducts();
    }
  }

  // Navigate to the next page
  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.getProducts();
    }
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  // Method to verify the token and retrieve user details
  fetchUserDetails() {
    const token = localStorage.getItem('token');

    if (token) {
      const headers = new HttpHeaders({
        Authorization: `Bearer ${token}`,
      });

      this.http
        .get(`${environment.apiUrl}/auth/user-details`, { headers })
        .subscribe(
          (response: any) => {
            this.username = response.username;
            this.email = response.email;
            this.thumbnail = response.profile_pic || 'assets/photo.jpg';
          },
          (error) => {
            console.error('Error fetching user details:', error);
            this.logout();
          }
        );
    }
  }

  // Open modal to upload profile photo
  openProfilePhotoModal() {
    this.isModalOpen = true; 
    document.body.classList.add('modal-open'); // Prevents background interaction
  }
  
  openModal() {
    this.isModalOpen = false;
  }
  // Close the modal
  closeModal() {
    this.isModalOpen = false; 
    document.body.classList.remove('modal-open'); // Restore normal behavior
  }
  

  // Handle file selection
  //The onFileChange method is an event handler that is triggered whenever the user selects a file using the <input type="file"> element.
  onFileChange(event: any) {
    const file = event.target.files[0]; // Get the first selected file
    if (file) {
      this.selectedFile = file; // Store the selected file in the selectedFile variable
      console.log('Selected file:', file);
    }
  }

  // Upload the profile photo to the backend
  uploadProfilePhoto() {
    if (!this.selectedFile) {
      alert('Please select a file first.');
      return;
    }

    const formData = new FormData();
    formData.append('profile_pic', this.selectedFile);

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    this.isUploading = true;

    this.http
      .post(`${environment.apiUrl}/auth/upload-profile-photo`, formData, {
        headers,
      })
      .subscribe(
        (response: any) => {
          console.log('File uploaded successfully:', response);
          this.thumbnail = response.url; // Update the profile picture in the UI
          this.isUploading = false;
        },
        (error) => {
          console.error('Error uploading file:', error);
          this.isUploading = false;
        }
      );
  }

  // Logout method to clear localStorage and redirect to login page
  logout(): void {
    localStorage.clear(); // Clear the local storage
    window.location.href = '/login'; // Redirect to login page
  }
  // Handle file drag over event
  onDragOver(event: DragEvent) {
    event.preventDefault(); // Allow the drop
    const dropzone = document.querySelector('.drag-drop-area')!;
    dropzone.classList.add('dragover');
  }

  // Handle file drag leave event
  onDragLeave(event: DragEvent) {
    const dropzone = document.querySelector('.drag-drop-area')!;
    dropzone.classList.remove('dragover');
  }

  // Handle file drop event
  onDrop(event: DragEvent) {
    event.preventDefault(); // Prevent the default drop behavior
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      console.log('Dropped files:', files);
      this.selectedFile = files[0]; // If you want to select the first file
    }

    const dropzone = document.querySelector('.drag-drop-area')!;
    dropzone.classList.remove('dragover'); // Remove dragover style after drop
  }
  onFileSelectimport(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  uploadFilesforimport(): void {
    if (!this.selectedFile) {
      alert('Please select a file first.');
      return;
    }
    console.log('***',this.selectedFile);
   
    const formData = new FormData();
    formData.append('file', this.selectedFile);
   
    this.http.post(`${environment.apiUrl}/auth/import`, formData).subscribe({
      next: (response: any) => {
        alert('File uploaded successfully, processing in background.');
        console.log('Response:', response);
      },
      error: (error) => {
        console.error('Error uploading file:', error);
        alert('Failed to upload file.');
      },
    });
  }

  // Wrapper function for button click
  uploadFilesImport(): void {
    this.uploadFilesforimport();
  }

  navigateToImportFile() {
    this.router.navigate(['/importfile']);
  }
}
export interface product {
  product_id: number;
  product_name: string;
  category_id: number;
  quantity_in_stock: number;
  unit_price: number;
  product_image: string;
  product_status: string;
  unit: string;
  vendor_id: number;
  selectedFile: File | null;
  isEditing: boolean;
  originalData: any;
  selectedVendorId: number;
  isSelected: boolean;
  selected: boolean;
  initialQuantity: number;
}