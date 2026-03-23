import api from '@/api/interceptor'
import { type ProjectForm  } from '@/schemas/project'

interface CreateProjectOptions {
  saveAsDraft?: boolean;
}

interface UpdateProjectOptions {
  removeImageUrls?: string[];
  newImages?: File[];
}

interface GetProjectsOptions {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export const createProject = async (data: ProjectForm, options?: CreateProjectOptions) => {
  try {
    const formData = new FormData();
    const saveAsDraft = options?.saveAsDraft ?? false;

    formData.append('saveAsDraft', String(saveAsDraft));
    
    // Add text fields
    if (data.title) {
      formData.append('title', data.title);
    }
    if (data.roomType) {
      formData.append('roomType', data.roomType);
    }
    if (data.description) {
      formData.append('description', data.description);
    }
    
    // Handle address
    if (data.address) {
      formData.append('address', JSON.stringify(data.address));
    }
    
    // Handle budget - backend expects { min: number, max: number }
    // const budgetValue = data.customBudget 
    //   ? data.customBudget 
    //   : data.budgetRange 
    //     ? (data.budgetRange.min + data.budgetRange.max) / 2  // Use midpoint of range
    //     : 0;
    
    // formData.append('budgetRange', JSON.stringify({
    //   min: budgetValue,
    //   max: budgetValue
    // }));

    if (data.budgetRange) {
      formData.append('budgetRange', JSON.stringify({
        min: data.budgetRange.min,
        max: data.budgetRange.max
      }));
    }
    if (data.customBudget) {
      formData.append('customBudget', data.customBudget.toString());
    }

    if (data.startDate) {
      formData.append('startDate', data.startDate.toISOString());
    }
    
    // Add image files
    if (data.images && data.images.length > 0) {
      data.images.forEach((img) => {
        formData.append('images', img.file);
      });
    }
    
    const response = await api.post('/projects', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
};

export const getProjects = async () => {
  try {
    const response = await api.get('/projects');
    return response.data;
  } catch (error) {
    console.error('Error fetching projects:', error);
    throw error;
  };
};

export const getProjectsWithFilters = async (options: GetProjectsOptions = {}) => {
  try {
    const response = await api.get('/projects', {
      params: {
        page: options.page,
        limit: options.limit,
        search: options.search,
        status: options.status,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching filtered projects:', error);
    throw error;
  }
};

export const getProjectById = async (projectId: string) => {
  try {
    const response = await api.get(`/projects/${projectId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching project:', error);
    throw error;
    };
};

export const updateProject = async (
  projectId: string,
  data: Partial<ProjectForm>,
  options?: UpdateProjectOptions,
) => {
  try {
    const formData = new FormData();

    const cleanText = (value?: string) => {
      if (value === undefined) return undefined;
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    };

    const title = cleanText(data.title);
    if (title !== undefined) {
      formData.append('title', title);
    }

    const roomType = cleanText(data.roomType);
    if (roomType !== undefined) {
      formData.append('roomType', roomType);
    }

    const description = cleanText(data.description);
    if (description !== undefined) {
      formData.append('description', description);
    }

    if (data.address !== undefined) {
      const address = {
        street: cleanText(data.address.street),
        city: cleanText(data.address.city),
        state: cleanText(data.address.state),
        zipCode: cleanText(data.address.zipCode),
      };

      const hasAnyAddressField = Object.values(address).some(
        (value) => value !== undefined,
      );

      if (hasAnyAddressField) {
        formData.append('address', JSON.stringify(address));
      }
    }

    if (data.budgetRange !== undefined) {
      formData.append('budgetRange', JSON.stringify(data.budgetRange));
    }

    if (typeof data.customBudget === 'number' && data.customBudget > 0) {
      formData.append('customBudget', String(data.customBudget));
    }

    if (data.startDate !== undefined) {
      formData.append('startDate',
        data.startDate instanceof Date
          ? data.startDate.toISOString()
          : data.startDate,
      );
    }

    if (options?.removeImageUrls && options.removeImageUrls.length > 0) {
      formData.append('removeImageUrls', JSON.stringify(options.removeImageUrls));
    }

    if (options?.newImages && options.newImages.length > 0) {
      options.newImages.forEach((file) => {
        formData.append('images', file);
      });
    }

    const response = await api.patch(`/projects/${projectId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error updating project:', error);
    throw error;
  };
};

export const deleteProject = async (projectId: string) => {
  try {
    const response = await api.delete(`/projects/${projectId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error;
  };
};

export const updateProjectStatus = async (
  projectId: string,
  status: "draft" | "bidding" | "cancelled",
) => {
  try {
    const response = await api.patch(`/projects/${projectId}/status`, { status });
    return response.data;
  } catch (error) {
    console.error("Error updating project status:", error);
    throw error;
  }
};